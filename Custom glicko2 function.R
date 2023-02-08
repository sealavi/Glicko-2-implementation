# Function to implement Glicko-2 rating system
# mu: initial mean rating player 1
# mu2: initial mean rating player 2
# phi: initial rating deViation player 1
# phi2: initial rating deViation player 2
# sigma: initial Volatility
# outcomes: results of each game played
# elapsed_time1: Last timestamp player 1 competed
# elapsed_time2: Last timestamp player 2 competed
glicko2 <- function(mu, mu2, phi, phi2, sigma, outcomes,elapsed_time1, elapsed_time2 ) {
  tau <- 0.6
  # Step 1 
  n <- length(outcomes)
  # Step 2
  
  phi <-sqrt(phi^2 + tau^2 * elapsed_time1)
  phi <- phi/173.7178
  
  phi2 <-sqrt(phi2^2 + tau^2 * elapsed_time2)
  phi2 <- phi2/173.7178
  
  mu <- (mu - 1500)/173.7178
  mu2 <- (mu2 - 1500)/173.7178
  
  g <- function(phi) {
    return(1/sqrt(1 + 3 * phi^2 / pi^2))
  }
  # Step 2a
  V <- 0
  for(i in 1:n){
    V <- V + (g(phi2[i])^2)*(1/(1 + exp(-g(phi2[i])*(mu-mu2[i]))))*(1-(1/(1 + exp(-g(phi2[i])*(mu-mu2[i])))))
  }
  
  V <- 1/V
  
  # Step 2b
  delta <- 0
  for(i in 1:n){
    delta <-delta + g(phi2[i])*(outcomes[i]) - (1 / (1 + exp(-g(phi2[i])*(mu-mu2[i])))^2)
  }
  
  
  # Step 2c
  delta <- delta * V
  
  # Step 3
  a <- log(sigma^2)
  A <- a
  # Step 4
  f <- function(x) {
    return(((exp(x)*((delta^2 - phi^2 - V - exp(x)))) / (2 * (phi^2 + V + exp(x))^2)) - ((x - a) / tau^2))
  }
  # Step 5
  # 5.1
  tolerance <- 0.000001
  
  if(delta^2 > phi^2 + V){
    B <- log(delta^2 - phi^2 - V)
  } else {
    if(delta^2 <= phi^2 + V){
      K=1
      while (f(a-K*tau)<0){
        K=K+1
      }
      B <- a-K*tau
    }
    
  }
  
  # 5.2
  fa=f(A)
  fb=f(B)
  while (abs(B - A) > tolerance) {
    C <- A + (A - B)*(fa/(fb-f(A)))
    fc=f(C)
    if (fc * fb <= 0) {
      A <- B
      fa=fb
      B <- C
      fb=fc
    } else {
      fa=fa/2
    }
  }
  # Step 5.3
  sigma_star <- exp(A/2)
  # Step 5.4
  # 5.4a
  phi_star_squared <- phi^2 + sigma_star^2
  # 5.4b
  phi_star <- sqrt(phi_star_squared)
  phi_prime <- 1/sqrt(((1/phi_star^2) + (1/V)))
  
  # Step 6
  # Step 7
  # Step 8
  
  mu_star <- 0
  for(i in 1:n){
    E <- 1 / (1 + exp(-g(phi2[i]) * (mu - mu2[i])))
    mu_star <- mu_star + g(phi2[i])*(outcomes[i] - E)
  }
  mu_prime <- mu + (phi_prime^2)*mu_star
  mu_prime <- (mu_prime * 173.7178) + 1500
  phi_prime <- phi_prime * 173.7178
  
  return(list(mu = mu_prime, phi = phi_prime, sigma = sigma_star))
}


Rating_calculator <- function(data, state){
  newdata=c()
  count=1
  if (!is.data.frame(data)) 
    data <- as.data.frame(data)
  if (!is.data.frame(state)) 
    state <- as.data.frame(state)
  
  data$timestamp <- as.POSIXct(data$timestamp, format="%Y-%m-%d %H:%M:%S",origin="01-01-1900", tz="UTC")
  data=data[
    with(data, order(data$timestamp)),
  ]
  state$Last_comp <- as.POSIXct(state$Last_comp, format="%Y-%m-%d %H:%M:%S",origin="01-01-1900", tz="UTC")
  
  #allplayers <- sort(unique(c(data$Player1, data$Player2)))
  
  #initindex <- match(state$Player, allplayers)
  
  datasplit <- split(data, as.factor(as.character(data$timestamp)))
  for(i in 1:length(datasplit)){
    temp <- datasplit[[i]]
    temp$timestamp <-as.POSIXct(temp$timestamp, format="%Y-%m-%d %H:%M:%S",origin="01-01-1900", tz="UTC")
    players <- sort(unique(c(temp$Player1, temp$Player2)))
    numplayers <- length(players)
    initindex <- as.numeric(na.omit(match(state$Player, players)))
    
    for(j in 1:numplayers){
      temp2<-temp[which(temp$Player1==players[j]),]
      
      if(length(which(temp$Player2==players[j]))>0){
        temp2b <- data.frame(timestamp  = temp$timestamp[which(temp$Player2==players[j])],
                             Player1 = players[j],
                             Player2 = temp$Player1[which(temp$Player2==players[j])], 
                             Score = abs(temp$Score[which(temp$Player2==players[j])] -1))
        temp2 <- rbind(temp2,temp2b)
      } 
      
      
      temp2$Rating1<-NA
      temp2$Rating2<-NA
      temp2$RD1<-NA
      temp2$RD2<-NA
      temp2$elapsed_time1<-NA
      temp2$elapsed_time2<-NA
      temp2$sigma<-NA
      
      for(k in 1:nrow(temp2)){
        temp2$Rating1[k] <-state$Rating[which(state$Player==temp2$Player1[k])]
        temp2$Rating2[k] <-state$Rating[which(state$Player==temp2$Player2[k])]
        temp2$RD1[k] <-state$DeViation[which(state$Player==temp2$Player1[k])]
        temp2$RD2[k] <-state$DeViation[which(state$Player==temp2$Player2[k])]
        temp2$elapsed_time1[k] <- as.numeric(difftime(temp2$timestamp[k], state$Last_comp[which(state$Player==temp2$Player1[k])], units = "days"))
        temp2$elapsed_time2[k] <-as.numeric(difftime(temp2$timestamp[k], state$Last_comp[which(state$Player==temp2$Player2[k])], units = "days"))
        temp2$sigma[k] <-state$Volatility[which(state$Player==temp2$Player1[k])]
        
        
      }
      
      updated_rating = glicko2(mu = unique(temp2$Rating1), mu2 = temp2$Rating2, phi = unique(temp2$RD1), phi2 = temp2$RD2, sigma = unique(temp2$sigma), outcomes = temp2$Score,elapsed_time1 = unique(temp2$elapsed_time1), elapsed_time2 = unique(temp2$elapsed_time2))
      
      tempstate <- data.frame(Player = players[j],
                              Rating = updated_rating$mu,
                              DeViation  = updated_rating$phi, 
                              Volatility = updated_rating$sigma,
                              Last_comp = unique(temp2$timestamp))
      
      
      
      if(nrow(state[-initindex,])>0){
        to_update <- seq(from = 1, to = nrow(state), by=1)
        to_update <- to_update[-initindex]
        for(l in 1:length(to_update)){
          state$DeViation[to_update[l]] <- sqrt((state$DeViation[to_update[l]]^2 + state$Volatility[to_update[l]]^2))
        }
        
      newdata[count]=list(tempstate)
      count=count+1
      
    }
  }
  
  for(m in 1:length(newdata)){
    state[which(state$Player==newdata[[m]]$Player),] = newdata[[m]][1,]
  }
  

  }
  return(state)
  
}

# ##### Example implementation
# initstate <- data.frame(Player=c("a","b","c","d","e","f","g","h"), Rating = c(1500,1400,1550,1700,1500,1400,1550,1700), 
#                         DeViation = c(200,30,100,300,200,30,100,300), Volatility = 0.06, Last_comp = "2023-02-05 15:14:35")
# games <- data.frame(timestamp = c(rep("2023-02-06 15:14:35",3),rep("2023-02-07 15:14:35",3)), Player1 = "a", Player2 = c("b","c","d","b","c","d"), Score = c(1,0,0,1,0,0))
# 
# 
# Rating_calculator(data=games, state=initstate)
