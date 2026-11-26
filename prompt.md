Implement a watch and track list of movies and series with i18n suport starting with English (en) and Brazilian Portuguese (pt-BR)  within your existing frontend and backend.

The goal is to recommend you "NEXT BINGE WATCH", wich is the name of this application.

Users should be able to enter part of the title of movie, serie or search for people's name and view the result in a one or more itens and after select one result, get the profile by it ID.

From a movie profile, the user should be able to see the cast list (artist, director, author) and select a person to see its profile, and in the person profile, the user should be able to see its title's list (movies, series, etc)

Use the TVmaze API (https://www.tvmaze.com/api) to retrieve data (it is free and does not require an API key):

Licensing: Use of the TVmaze API is licensed by CC BY-SA. This means the data can freely be used for any purpose, as long as TVmaze is properly credited as source and your usage complies with the ShareAlike provision. You can satisfy the attribution requirement by linking back to TVmaze from within your application or website, for example using the URLs available in the API.

- TVmaze API: https://api.tvmaze.com/search/shows?q=:query (to fetch data)

The frontend must fetch data exclusively from the backend. Optionally, the frontend can attempt to detect the user's language via the browser and automatically sent the language param to backend.

Create an endpoint on the backend for the frontend to consume, and display the retrieved data on the specifi profile view by type of content (movie/serie/person).
