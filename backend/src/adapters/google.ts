import axios from 'axios';

const GOOGLE_BASE_URL = 'https://maps.googleapis.com/maps/api/directions/json';

export async function getGoogleTransitRoute(origin: string, destination: string, departureTime?: number) {
    const params = {
        origin,
        destination,
        mode: 'transit',
        key: process.env.GOOGLE_API_KEY,
        departure_time: departureTime || 'now',
    };

    try {
        const response = await axios.get(GOOGLE_BASE_URL, { params });
        const data = response.data;

        if (data.status !== 'OK') {
            throw new Error(data.error_message || 'Google API error');
        }

        return {
            provider: 'google',
            routes: data.routes.map((route: any) => ({
                summary: route.summary,
                legs: route.legs.map((leg: any) => ({
                    start: leg.start_address,
                    end: leg.end_address,
                    duration: leg.duration.text,
                    steps: leg.steps.map((step: any) => ({
                        travelMode: step.travel.mode,
                        instructions: step.html_instructions,
                        duration: step.duration.text, 
                    }))
                }))
            }))
        };
    } catch (error: any) {
        console.error('Google API error:', error.message);
        return null;
    }
}
