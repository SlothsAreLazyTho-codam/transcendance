# **************************************************************************** #
#                                                                              #
#                                                         ::::::::             #
#    Makefile                                           :+:    :+:             #
#                                                      +:+                     #
#    By: cbijman <cbijman@student.codam.nl>           +#+                      #
#                                                    +#+                       #
#    Created: 2025/05/28 17:03:11 by cbijman       #+#    #+#                  #
#    Updated: 2025/05/28 17:03:11 by cbijman       ########   odam.nl          #
#                                                                              #
# **************************************************************************** #

CXX=docker-compose
CXX_FILE= -f docker-compose.yml

all: up

up:
	$(CXX) $(CXX_FILE) $@

down:
	$(CXX) $(CXX_FILE) $@ --remove-orphans

build:
	$(CXX) $(CXX_FILE) $@

dev: clean
	$(CXX) -f dev.docker-compose.yml up --build

clean:
	$(CXX) $(CXX_FILE) down -v --remove-orphans

fclean: clean
	docker system prune -af

re: clean all

.PHONY: up down build clean fclean re