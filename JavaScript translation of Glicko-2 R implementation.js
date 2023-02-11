// Function to implement Glicko-2 rating system
function glicko2(mu, mu2, phi, phi2, sigma, outcomes, elapsed_time1, elapsed_time2) {
  let tau = 0.6;
  let n = outcomes.length;
  
  // Step 1
  
  // Step 2
  phi = Math.sqrt(phi**2 + tau**2 * elapsed_time1);
  phi = phi / 173.7178;
  
  phi2 = Math.sqrt(phi2**2 + tau**2 * elapsed_time2);
  phi2 = phi2 / 173.7178;
  
  mu = (mu - 1500) / 173.7178;
  mu2 = (mu2 - 1500) / 173.7178;
  
  let g = function(phi) {
    return 1 / Math.sqrt(1 + 3 * phi**2 / Math.PI**2);
  };
  
  // Step 2a
  let V = 0;
  for (let i = 0; i < n; i++) {
    let gi = g(phi2[i]);
    V += gi**2 * (1 / (1 + Math.exp(-gi * (mu - mu2[i])))) * (1 - (1 / (1 + Math.exp(-gi * (mu - mu2[i])))));
  }
  
  V = 1 / V;
  
  // Step 2b
  let delta = 0;
  for (let i = 0; i < n; i++) {
    let gi = g(phi2[i]);
    delta += gi * (outcomes[i]) - (1 / (1 + Math.exp(-gi * (mu - mu2[i])))**2);
  }
  
  // Step 2c
  delta = delta * V;
  
  // Step 3
  let a = Math.log(sigma**2);
  let A = a;
  
  // Step 4
  let f = function(x) {
    return (
      ((Math.exp(x) * ((delta**2 - phi**2 - V - Math.exp(x)))) / (2 * (phi**2 + V + Math.exp(x))**2)) -
      ((x - a) / tau**2)
    );
  };
  
  // Step 5
  // 5.1
  let tolerance = 0.000001;
  
  let B;
  if (delta**2 > phi**2 + V) {
    B = Math.log(delta**2 - phi**2 - V);
  } else if (delta**2 <= phi**2 + V) {
    let K = 1;
    while (f(a - K * tau) < 0) {
      K = K + 1;
    }
    B = a - K * tau;
  }
  
  // 5.2
  let fa = f(A);
let fb = f(B);

while (Math.abs(B - A) > tolerance) {
let C = A + (A - B) * (fa / (fb - f(A)));
let fc = f(C);
if (fc * fb <= 0) {
A = B;
fa = fb;
B = C;
fb = fc;
} else {
fa = fa / 2;
}
}

// Step 5.3
let sigma_star = Math.exp(A / 2);

// Step 5.4
// 5.4a
let phi_star_squared = phi ** 2 + sigma_star ** 2;

// 5.4b
let phi_star = Math.sqrt(phi_star_squared);
let phi_prime = 1 / Math.sqrt((1 / phi_star ** 2) + (1 / V));

// Step 6
// Step 7
// Step 8

let mu_star = 0;
for (let i = 0; i < n; i++) {
let E = 1 / (1 + Math.exp(-g(phi2[i]) * (mu - mu2[i])));
mu_star += g(phi2[i]) * (outcomes[i] - E);
}

let mu_prime = mu + phi_prime ** 2 * mu_star;
mu_prime = mu_prime * 173.7178 + 1500;
phi_prime = phi_prime * 173.7178;

return { mu: mu_prime, phi: phi_prime, sigma: sigma_star };
};



function Rating_calculator(data, state) {
  let newdata = [];
  let count = 1;
  
  if (!Array.isArray(data)) {
    data = data.map((val) => Object.values(val));
  }
  if (!Array.isArray(state)) {
    state = state.map((val) => Object.values(val));
  }
  
  data.forEach((val) => {
    val.timestamp = new Date(val.timestamp);
  });
  data = data.sort((a, b) => a.timestamp - b.timestamp);
  
  state.forEach((val) => {
    val.Last_comp = new Date(val.Last_comp);
  });

  let datasplit = [];
  let dataMap = new Map();
  data.forEach((val) => {
    if (!dataMap.has(val.timestamp)) {
      dataMap.set(val.timestamp, []);
    }
    dataMap.get(val.timestamp).push(val);
  });
  dataMap.forEach((val) => {
    datasplit.push(val);
  });
  
  for (let i = 0; i < datasplit.length; i++) {
    let temp = datasplit[i];
    temp.forEach((val) => {
      val.timestamp = new Date(val.timestamp);
    });
    let players = temp.map((val) => val.Player1).concat(temp.map((val) => val.Player2)).sort().filter((val, index, arr) => arr.indexOf(val) === index);
    let numplayers = players.length;
    let initindex = state.filter((val) => players.indexOf(val.Player) !== -1).map((val) => state.indexOf(val));
    for (let j = 0; j < numplayers; j++) {
      let temp2 = temp.filter((val) => val.Player1 === players[j]);
      if (temp.filter((val) => val.Player2 === players[j]).length > 0) {
        let temp2b = temp.filter((val) => val.Player2 === players[j]).map((val) => {
          return {
            timestamp: val.timestamp,
            Player1: players[j],
            Player2: val.Player1,
            Score: Math.abs(val.Score - 1)
          };
        });
        temp2 = temp2.concat(temp2b);
      }
      temp2.forEach((val) => {
        val.Rating1 = state.filter((val2) => val2.Player === val.Player1)[0].Rating;
        val.Rating2 = state.filter((val2) => val2.Player === val.Player2)[0].Rating;
        val.RD1 = state.filter((val2) => val2.Player === val.Player1)[0].DeViation;
        val.RD2 = state.filter((val2) => val2.Player === val.Player2)[0].DeViation

        let expectedScore1 = 1 / (1 + Math.pow(10, (val.Rating2 - val.Rating1) / 400));
        let expectedScore2 = 1 / (1 + Math.pow(10, (val.Rating1 - val.Rating2) / 400));

        let newRating1 = val.Rating1 + (val.K * (val.Score1 - expectedScore1));
        let newRating2 = val.Rating2 + (val.K * (val.Score2 - expectedScore2));

        let newRD1 = Math.sqrt(val.RD1 * val.RD1 + val.tau * val.tau);
        let newRD2 = Math.sqrt(val.RD2 * val.RD2 + val.tau * val.tau);

        state = state.map((val2) => {
            if (val2.Player === val.Player1) {
                return {
                    Player: val2.Player,
                    Rating: newRating1,
                    DeViation: newRD1
                };
            }
            else if (val2.Player === val.Player2) {
                return {
                    Player: val2.Player,
                    Rating: newRating2,
                    DeViation: newRD2
                };
            }
            else {
                return val2;
            }
        });
    });

    return state;
}
