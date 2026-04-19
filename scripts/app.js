// CREATE VUE APP
const app = Vue.createApp({

    // Application state: user, weather, dictionary, UI state
    data() {
        return {
            user: null,

            // Default weather location
            city: "London",
            province: "Ontario",
            country: "Canada",
            weather: [],

            // Dictionary data
            word: "",
            dictionary: null,

            // UI state
            loading: false,
            error: ""
        };
    },

    // COMPUTED: format weather data for display
    computed: {
        formattedWeather() {
            return this.weather.map(item => {
                return {
                    ...item, // copy original properties
                    time: item.time.replace("T", " ") // format time
                };
            });
        }
    },

    // METHODS
    methods: {

        // Fetch random user data
        getUser() {
            fetch("https://randomuser.me/api/")
                .then(res => res.json())
                .then(data => {
                    this.user = data.results[0];
                })
                .catch(() => {
                    this.error = "Error loading user";
                });
        },

        // Fetch weather data (2-step API)
        getWeather() {

            // Set loading state
            this.loading = true;
            this.error = "";

            const city = this.city.trim().toLowerCase();
            const province = this.province.trim().toLowerCase();
            const country = this.country.trim().toLowerCase();

            //Get coordinates

            // STEP 1: If default London, Ontario, use fixed coordinates
            if (city === "london" && province === "ontario" && country === "canada") {

                const latitude = 42.98339;
                const longitude = -81.23304;

                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`)
                    .then(res => res.json())
                    .then(weatherData => {
                        if (!weatherData.current_weather) {
                            throw new Error("Weather data unavailable");
                        }

                        this.weather = [{
                            time: weatherData.current_weather.time,
                            temp: weatherData.current_weather.temperature,
                            wind: weatherData.current_weather.windspeed,
                            code: weatherData.current_weather.weathercode
                        }];
                    })
                    .catch(err => {
                        this.error = err.message;
                    })
                    .finally(() => {
                        this.loading = false;
                    });

                return;
            }
            else{
            fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&country=${country}&count=1`)
                .then(res => res.json())
                .then(data => {

                    if (!data.results || data.results.length === 0) {
                        throw new Error("Location not found");
                    }
                    const loc = data.results[0];
                    

                    // Step 2: fetch weather using coordinates
                    return fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true`
                    );
                })
                .then(res => res.json())
                .then(weatherData => {

                    this.weather = [{
                        time: new Date().toISOString(),
                        temp: weatherData.current_weather.temperature,
                        wind: weatherData.current_weather.windspeed,
                        code: weatherData.current_weather.weathercode
                    }];

                })
                .catch(err => {
                    this.error = err.message;
                })
                .finally(() => {
                    this.loading = false;
                });
            }
        },

        // Fetch word definition
        getDefinition() {

            // Prevent empty input
            if (!this.word.trim()) return;

            fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${this.word}`)
                .then(res => res.json())
                .then(data => {
                    this.dictionary = {
                        word: data[0].word,
                        phonetic: data[0].phonetic || "N/A",
                        definition: data[0].meanings[0].definitions[0].definition
                    };
                })
                .catch(() => {
                    this.error = "Word not found";
                });
        },

        // Convert weather code to readable text
        getWeatherDescription(code) {
            const map = {
                0: "Clear sky",
                1: "Mainly clear",
                2: "Partly cloudy",
                3: "Overcast",
                45: "Fog",
                61: "Rain",
                71: "Snow",
                95: "Thunderstorm"
            };
            return map[code] || "Unknown";
        }
    },

    // Run on page load
    mounted() {
        this.getUser();
        this.getWeather();
    }

});
// Mount Vue app
app.mount("#app");