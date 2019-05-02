DROP TABLE IF EXISTS locations;

DROP TABLE IF EXISTS weather;

DROP TABLE IF EXISTS events;

CREATE TABLE locations (
  search_query VARCHAR (255),
  formatted_query VARCHAR(255),
  latitude DECIMAL,
  longitude DECIMAL
);

CREATE TABLE weather (
  forcast VARCHAR(255),
  time_of_day DATE
);

CREATE TABLE events (
  link VARCHAR (255),
  event_name VARCHAR(255),
  event_date DATE,
  summary VARCHAR (255)
);