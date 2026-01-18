export async function onRequest(context) {
    const { env } = context;

    // Configuration
    const API_KEY = env.OPENWEATHER_API_KEY;
    const LAT = "29.1872"; // Ocala
    const LON = "-82.1401";

    // Default: Clear skies (if no key or error)
    const defaultState = {
        isStorming: false,
        temp: 75,
        condition: "Clear",
        description: "Sunny Florida Day"
    };

    if (!API_KEY) {
        // Mock mode for testing without key
        // return new Response(JSON.stringify({ ...defaultState, isStorming: true, condition: "Thunderstorm" }), { 
        //     headers: { 'Content-Type': 'application/json' } 
        // });
        return new Response(JSON.stringify(defaultState), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=imperial`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.weather) throw new Error("Invalid Weather Data");

        const mainWeather = data.weather[0].main; // Rain, Thunderstorm, Drizzle, Clear
        const description = data.weather[0].description;
        const id = data.weather[0].id; // Weather condition codes

        // Determine if "Storm Mode" should be active
        // Codes: 2xx (Thunderstorm), 3xx (Drizzle), 5xx (Rain)
        const isStorming = (id >= 200 && id <= 531);

        return new Response(JSON.stringify({
            isStorming,
            temp: Math.round(data.main.temp),
            condition: mainWeather,
            description: description
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Weather Fetch Error:", error);
        return new Response(JSON.stringify(defaultState), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
