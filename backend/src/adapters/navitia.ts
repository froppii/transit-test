import axios from 'axios';

const NAVITIA_BASE_URL = 'https://api.navitia.io/v1/coverage';

export async function getNavitiaTransitRoute(from: string, to: string) {
    try {
        const response = await axios.get(NAVITIA_BASE_URL, {
            auth: { username: process.env.NAVITIA_TOKEN || '', password: '' },
            params: { from, to}
        });

        const data = response.data;

        return {
            provider: 'navitia',
            routes: data.journeys.map((journey: any) => ({
                duration: journey.duration,
                legs: journey.legs.map((section: any) => ({
                    mode: section.mode || section.type,
                    from: section.from?.name,
                    to: section.to?.name,
                    duration: section.duration,
                }))
            }))
        };
    } catch (error: any) {
        console.error('Navitia API Error:', error.message);
        return null;
    }
}