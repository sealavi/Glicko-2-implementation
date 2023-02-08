# Glicko-2-implementation
Implementation of the Glicko-2 rating system in R and C#

Functions to implement the Glicko-2 rating system in R. 

The Glicko-2 rating system is an improvement over the Elo system. It provodes estimates of individual player ratings, as well as rating deviations (uncertainties in the rating).
Additionally, the Glicko-2 system estimates the rating volitility of each player, which estimates how much a player's rating is expected to fluctuate based on how eratic their performances are.

Custom glicko2 function.R includes two functions. 
glicko2() implements the Glicko-2 algorithm as described by Mark Glickman https://www.glicko.net/glicko/glicko2.pdf
Rating_calculator() takes processes input data and calls on the glicko2() functin to calculate and update the ratings, deviations, and volitilities of all players. 
Rating_calculator() requires two arguments as inputs (data and state). "data" should be a data frame with the current player information and should contain the following columns:
Player, Rating, DeViation, Volatility, Last_comp
Player should be the identity of the player, and LAst_comp should be the datetime of their most recent competition. 
"state" should be a data frame with the competition outcomes and should include the following columns:
timestamp, Player1, Player2, Score

Competition outcomes should be stored in the "Score" column, and should reflect the outcome from the perspective of Player1. 
1 indicates that Player1 was the winner
0 indicates that Player1 was the looser
.5 indicates that the contest was a draw.



"C# Translation of Glicko-functions.cs" includes both of the above functions, translated from R into C#. ChatGPT was used to translate the functions. 
These functions have not yet been tested. 
