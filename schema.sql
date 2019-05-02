CREATE TABLE location (
  search_query VARCHAR (255),
  formatted_query VARCHAR(255),
  latitude DECIMAL,
  longitude DECIMAL,
);

CREATE TABLE weather (
  forcast VARCHAR(255),
  time DATE,
);

CREATE TABLE events (
  link VARCHAR (255),
  name VARCHAR(255),
  event_date DATE,
  summary VARCHAR (255),
);