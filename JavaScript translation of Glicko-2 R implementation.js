// Function to implement Glicko-2 rating system
const math = require('mathjs');

function glicko2(mu, mu2, phi, phi2, sigma, outcomes, elapsed_time1, elapsed_time2) {
  const tau = 0.6;
  const n = outcomes.length;

  phi = Math.sqrt(Math.pow(phi, 2) + Math.pow(tau, 2) * elapsed_time1) / 173.7178;
  phi2 = phi2.map((value) => Math.sqrt(Math.pow(value, 2) + Math.pow(tau, 2) * elapsed_time2) / 173.7178);

  mu = (mu - 1500) / 173.7178;
  mu2 = mu2.map((value) => (value - 1500) / 173.7178);

  const g = (phi) => 1 / Math.sqrt(1 + 3 * Math.pow(phi, 2) / Math.pow(Math.PI, 2));

  let V = 0;
  for (let i = 0; i < n; i++) {
    V += Math.pow(g(phi2[i]), 2) * (1 / (1 + Math.exp(-g(phi2[i]) * (mu - mu2[i])))) * (1 - (1 / (1 + Math.exp(-g(phi2[i]) * (mu - mu2[i])))));
  }

  V = 1 / V;

  let delta = 0;
  for (let i = 0; i < n; i++) {
    delta += g(phi2[i]) * (outcomes[i] - (1 / (1 + Math.exp(-g(phi2[i]) * (mu - mu2[i])))));
  }

  delta *= V;

  const a = Math.log(Math.pow(sigma, 2));
  let A = a;

  const f = (x) => {
    return (((Math.exp(x) * ((Math.pow(delta, 2) - Math.pow(phi, 2) - V - Math.exp(x)))) / (2 * Math.pow((Math.pow(phi, 2) + V + Math.exp(x)), 2))) - ((x - a) / Math.pow(tau, 2)));
  };

  let tolerance = 0.000001;
  let B;

  if (Math.pow(delta, 2) > Math.pow(phi, 2) + V) {
    B = Math.log(Math.pow(delta, 2) - Math.pow(phi, 2) - V);
  } else {
    let K = 1;
    while (f(a - K * tau) < 0) {
      K++;
    }
    B = a - K * tau;
  }

  let fa = f(A);
  let fb = f(B);

  while (Math.abs(B - A) > tolerance) {
    const C = A + (A - B) * (fa / (fb - f(A)));
    const fc = f(C);
    if (fc * fb <= 0) {
      A = B;
      fa = fb;
      B = C;
      fb = fc;
    } else {
      fa /= 2;
    }
  }

  const sigma_star = Math.exp(A / 2);
  const phi_star_squared = Math.pow(phi, 2) + Math.pow(sigma_star, 2);
  const phi_star = Math.sqrt(phi_star_squared);
  const phi_prime = 1 / Math.sqrt(((1 / Math.pow(phi_star, 2)) + (1 / V)));

  let mu_star = 0
  for (let i = 0; i < n; i++) {
    const E = 1 / (1 + Math.exp(-g(phi2[i]) * (mu - mu2[i])));
    mu_star += g(phi2[i]) * (outcomes[i] - E);
  }

  const mu_prime = mu + Math.pow(phi_prime, 2) * mu_star;
  const final_mu = (mu_prime * 173.7178) + 1500;
  const final_phi = phi_prime * 173.7178;

  return {
    mu: final_mu,
    phi: final_phi,
    sigma: sigma_star
  };
}

npm install lodash
const _ = require('lodash');

function ratingCalculator(data, state) {
  data = _.map(data, d => ({
    ...d,
    timestamp: new Date(d.timestamp)
  }));

  state = _.map(state, s => ({
    ...s,
    Last_comp: new Date(s.Last_comp)
  }));

  data = _.sortBy(data, 'timestamp');

  const allTimestamps = _.uniq(_.map(data, 'timestamp'));

  for (const timestamp of allTimestamps) {
    const currentData = _.filter(data, d => d.timestamp.getTime() === timestamp.getTime());
    const currentPlayers = _.uniq([..._.map(currentData, 'Player1'), ..._.map(currentData, 'Player2')]);

    for (const player of currentPlayers) {
      const playerGames = _.filter(currentData, d => d.Player1 === player || d.Player2 === player);
      const preparedGames = playerGames.map(game => {
        const isPlayer1 = game.Player1 === player;
        return {
          ...game,
          Rating1: isPlayer1 ? game.Rating1 : game.Rating2,
          Rating2: isPlayer1 ? game.Rating2 : game.Rating1,
          RD1: isPlayer1 ? game.RD1 : game.RD2,
          RD2: isPlayer1 ? game.RD2 : game.RD1,
          elapsed_time1: (game.timestamp - state.Last_comp) / (1000 * 60 * 60 * 24),
          elapsed_time2: (game.timestamp - state.Last_comp) / (1000 * 60 * 60 * 24),
          sigma: isPlayer1 ? game.sigma : game.sigma
        };
      });

      const playerState = _.find(state, { Player: player });
      const updatedRating = glicko2(
        playerState.Rating,
        preparedGames.map(game => game.Rating2),
        playerState.DeViation,
        preparedGames.map(game => game.RD2),
        playerState.Volatility,
        preparedGames.map(game => game.Score),
        preparedGames.map(game => game.elapsed_time1),
        preparedGames.map(game => game.elapsed_time2)
      );

      _.merge(playerState, {
        Rating: updatedRating.mu,
        DeViation: updatedRating.phi,
        Volatility: updatedRating.sigma,
        Last_comp: timestamp
      });
    }
  }

  return state;
}

// Example usage
//const initState = [
//  { Player: "a", Rating: 1500, DeViation: 200, Volatility: 0.06, Last_comp: "2023-02-05T15:14:35.000Z" },
//  { Player: "b", Rating: 1400, DeViation: 30, Volatility: 0.06, Last_comp: "2023-02-05T15:14:35.000Z" },
//  { Player: "c", Rating: 1550, DeViation: 100, Volatility: 0.06, Last_comp: "2023-02-05T15:14:35.000Z" },
//  { Player: "d", Rating: 1700, DeViation: 300, Volatility: 0.06, Last_comp: "2023-02-05T15:14:35.000Z" },
//  { Player: "e", Rating: 1500, DeViation: 200, Volatility: 0.06, Last_comp: "2023-02-05T15:14:35.000Z" },
//  { Player: "f", Rating: 1400, DeViation: 30, Volatility: 0.06, Last_comp: "2023-02-05T15:14:35.000Z" },
//  { Player: "g", Rating: 1550, DeViation: 100, Volatility: 0.06, Last_comp: "2023-02-05T15:14:35.000Z" },
//  { Player: "h", Rating: 1700, DeViation: 300, Volatility: 0.06, Last_comp: "2023-02-05T15:14:35.000Z" }
//];

//const games = [
//  { timestamp: "2023-02-06T15:14:35.000Z", Player1: "a", Player2: "b", Score: 1 },
//  { timestamp: "2023-02-06T15:14:35.000Z", Player1: "a", Player2: "c", Score: 0 },
//  { timestamp: "2023-02-06T15:14:35.000Z", Player1: "a", Player2: "d", Score: 0 },
//  { timestamp: "2023-02-07T15:14:35.000Z", Player1: "a", Player2: "b", Score: 1 },
//  { timestamp: "2023-02-07T15:14:35.000Z", Player1: "a", Player2: "c", Score: 0 },
//  { timestamp: "2023-02-07T15:14:35.000Z", Player1: "a", Player2: "d", Score: 0 }
//];

//const updatedRatings = ratingCalculator(games, initState);
//console.log(updatedRatings);


module.exports = {
  glicko2,
  ratingCalculator
};

