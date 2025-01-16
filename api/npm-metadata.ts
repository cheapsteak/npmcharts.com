import { VercelRequest, VercelResponse } from '@vercel/node';
import ky from 'ky';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
    const packageName = req.query.packageName;
    console.log(packageName);
    try {
        const [
            registryPackageResponse,
            registryDefinitivelyTypedResponse,
        ] = await Promise.all([
            ky.get(`https://registry.npmjs.org/${packageName}`).json(),
            ky.head(`https://registry.npmjs.org/@types/${packageName}`, {
                throwHttpErrors: false,
            }),
        ]);

        console.log(registryDefinitivelyTypedResponse.status);
        // console.log(registryDefinitivelyTypedResponse.status);

        const npmRegistryData = registryPackageResponse;
        const definitivelyTyped = registryDefinitivelyTypedResponse.status === 200;

        const latestVersionName = npmRegistryData['dist-tags']?.latest;
        const latestVersionData = npmRegistryData.versions[latestVersionName];

        res.send({
            definitivelyTyped,
            hasTypings:
                'types' in latestVersionData || 'typings' in latestVersionData,
            latestVersion: latestVersionName,
            description: latestVersionData.description,
            releaseDatesByVersion: npmRegistryData.time,
        });
    } catch (exception) {
        console.error(exception);
        res.status(500).send((exception as any)?.response?.data ?? 'Unknown error');
    }
}