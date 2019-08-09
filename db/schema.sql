CREATE DATABASE events_db;

USE events_db;

CREATE TABLE events
(
	id int(20) NOT NULL AUTO_INCREMENT,
	location varchar(255) NOT NULL,
    name varchar(255) NOT NULL,
	category varchar(255) NOT NULL,
	creator_id int(20) NOT NULL, AUTO_INCREMENT,
	upvotes int(300) NOT NULL,
	PRIMARY KEY (id)
);