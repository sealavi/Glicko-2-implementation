using System;
using System.Collections.Generic;
using System.Linq;

namespace Glicko2RatingSystem
{
    class Program
    {
        static void Main(string[] args)
        {
            double mu = 0;
            double mu2 = 0;
            double phi = 0;
            double phi2 = 0;
            double sigma = 0;
            double[,] outcomes = new double[,] { };
            double elapsed_time1 = 0;
            double elapsed_time2 = 0;
            double tau = 0.6;

            (mu, phi, sigma) = Glicko2(mu, mu2, phi, phi2, sigma, outcomes, elapsed_time1, elapsed_time2, tau);
            Console.WriteLine("mu: " + mu);
            Console.WriteLine("phi: " + phi);
            Console.WriteLine("sigma: " + sigma);
        }

        static (double, double, double) Glicko2(double mu, double mu2, double phi, double phi2, double sigma, double[,] outcomes, double elapsed_time1, double elapsed_time2, double tau)
        {
            int n = outcomes.GetLength(0);

            phi = Math.Sqrt(phi * phi + tau * tau * elapsed_time1);
            phi = phi / 173.7178;

            phi2 = Math.Sqrt(phi2 * phi2 + tau * tau * elapsed_time2);
            phi2 = phi2 / 173.7178;

            mu = (mu - 1500) / 173.7178;
            mu2 = (mu2 - 1500) / 173.7178;

            double[] g = new double[n];
            for (int i = 0; i < n; i++)
            {
                g[i] = 1 / Math.Sqrt(1 + 3 * phi2[i] * phi2[i] / Math.Pow(Math.PI, 2));
            }

            double V = 0;
            for (int i = 0; i < n; i++)
            {
                V = V + Math.Pow(g[i], 2) * (1 / (1 + Math.Exp(-g[i] * (mu - mu2[i])))) * (1 - (1 / (1 + Math.Exp(-g[i] * (mu - mu2[i])))));
            }

            V = 1 / V;

            double delta = 0;
            for (int i = 0; i < n; i++)
            {
                delta = delta + g[i] * (outcomes[i, 0]) - (1 / Math.Pow((1 + Math.Exp(-g[i] * (mu - mu2[i]))), 2));
            }

            delta = delta * V;

            double a = Math.Log(sigma * sigma);
            double A = a;
            double B = 0;
            double tolerance = 0.000001;
            if (Math.Pow(delta, 2) > (Math.Pow(phi, 2) + V))
            {
            B = Math.Log(Math.Pow(delta, 2) - Math.Pow(phi, 2) - V);
            }
            else
            {
            if (Math.Pow(delta, 2) <= Math.Pow(phi, 2) + V)
            {
            int K = 1;
            while (f(a - K * tau) < 0)
            {
            K = K + 1;
            }
            B = a - K * tau;
            }
            
            }
            
            fa = f(A);
            fb = f(B);
            while (Math.Abs(B - A) > tolerance)
            {
            double C = A + (A - B) * (fa / (fb - f(A)));
            double fc = f(C);
            if (fc * fb <= 0)
            {
            A = B;
            fa = fb;
            B = C;
            fb = fc;
            }
            else
            {
            fa = fa / 2;
            }
            }
            
            double sigma_star = Math.Exp(A / 2);
            double phi_star_squared = Math.Pow(phi, 2) + Math.Pow(sigma_star, 2);
            double phi_star = Math.Sqrt(phi_star_squared);
            double phi_prime = 1 / Math.Sqrt((1 / Math.Pow(phi_star, 2)) + (1 / V));
            
            double mu_star = 0;
            for (int i = 0; i < n; i++)
            {double E = 1 / (1 + Math.Exp(-g(phi2[i]) * (mu - mu2[i])));
            mu_star = mu_star + g(phi2[i]) * (outcomes[i] - E);
            }
            
            double mu_prime = mu + (Math.Pow(phi_prime, 2)) * mu_star;
            mu_prime = (mu_prime * 173.7178) + 1500;
            phi_prime = phi_prime * 173.7178;
            
            return (mu_prime, phi_prime, sigma_star);



using System;
using System.Collections.Generic;
using System.Linq;

namespace RatingCalculator
{
    class Program
    {
        static void Main(string[] args)
        {
            var data = new List<Data>();
            var state = new List<State>();
            var newData = new List<Data>();
            var count = 1;

            if (!(data is List<Data>) || !(state is List<State>))
            {
                throw new Exception("Data and state must be of type List<Data> and List<State> respectively");
            }

            foreach (var d in data)
            {
                d.Timestamp = DateTime.ParseExact(d.Timestamp, "yyyy-MM-dd HH:mm:ss", null);
            }
            data = data.OrderBy(x => x.Timestamp).ToList();

            foreach (var s in state)
            {
                s.LastComp = DateTime.ParseExact(s.LastComp, "yyyy-MM-dd HH:mm:ss", null);
            }

            var dataSplit = data.GroupBy(x => x.Timestamp);
            foreach (var split in dataSplit)
            {
                var temp = split.ToList();
                foreach (var t in temp)
                {
                    t.Timestamp = DateTime.ParseExact(t.Timestamp, "yyyy-MM-dd HH:mm:ss", null);
                }

                var players = temp.Select(x => x.Player1).Union(temp.Select(x => x.Player2)).OrderBy(x => x).ToList();
                var numPlayers = players.Count();
                var initIndex = state.FindIndex(x => x.Player == players.FirstOrDefault(y => y == x.Player));

                for (int j = 0; j < numPlayers; j++)
                {
                    var temp2 = temp.Where(x => x.Player1 == players[j]).ToList();
                    if (temp.Any(x => x.Player2 == players[j]))
                    {
                        var temp2b = temp.Where(x => x.Player2 == players[j]).Select(x => new Data
                        {
                            Timestamp = x.Timestamp,
                            Player1 = players[j],
                            Player2 = x.Player1,
                            Score = Math.Abs(x.Score - 1)
                        }).ToList();
                        temp2.AddRange(temp2b);
                    }

                    foreach (var t2 in temp2)
                    {
                    t2.Rating1 = state.Where(s => s.Player == t2.Player1).Select(s => s.Rating).First();
                    t2.Rating2 = state.Where(s => s.Player == t2.Player2).Select(s => s.Rating).First();
                    t2.RD1 = state.Where(s => s.Player == t2.Player1).Select(s => s.DeViation).First();
                    t2.RD2 = state.Where(s => s.Player == t2.Player2).Select(s => s.DeViation).First();
                    t2.elapsed_time1 = (t2.timestamp - state.Where(s => s.Player == t2.Player1).Select(s => s.Last_comp).First()).TotalDays;
                    t2.elapsed_time2 = (t2.timestamp - state.Where(s => s.Player == t2.Player2).Select(s => s.Last_comp).First()).TotalDays;
                    t2.sigma = state.Where(s => s.Player == t2.Player1).Select(s => s.Volatility).First();
                    }
                    var updated_rating = Glicko2.Glicko2(temp2.Select(t => t.Rating1).Distinct().ToArray(), temp2.Select(t => t.Rating2).ToArray(),
                    temp2.Select(t => t.RD1).Distinct().ToArray(), temp2.Select(t => t.RD2).ToArray(), temp2.Select(t => t.sigma).Distinct().ToArray(),
                    temp2.Select(t => t.Score).ToArray(), temp2.Select(t => t.elapsed_time1).Distinct().ToArray(), temp2.Select(t => t.elapsed_time2).ToArray());
                    
                    var tempstate = new List<(string Player, double Rating, double DeViation, double Volatility, DateTime Last_comp)>()
                    for (int j = 0; j < numplayers; j++)
                    {
                    tempstate.Add((players[j], updated_rating.mu[j], updated_rating.phi[j], updated_rating.sigma[j], temp2.Select(t => t.timestamp).Distinct().First()));
                    }
                    
                    var to_update = Enumerable.Range(1, state.Count).ToList();
                    to_update.RemoveRange(initindex - 1, state.Count - initindex + 1);
                    if (to_update.Count > 0)
                    {
                    
                    foreach (var i in to_update)
                    {
                    state[i - 1] = tempstate.Where(ts => ts.Player == state[i - 1].Player).First();
                    }
                    }
                    else
                    {
                    state.AddRange(tempstate);
                    }
                    newdata.Add(temp2);
                    count++;
                    }
                    }
                    return (newdata, state);
