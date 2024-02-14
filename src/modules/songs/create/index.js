import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from 'uuid';

let dynamoDBClientParams = {}

if (process.env.IS_OFFLINE) {
    dynamoDBClientParams = {
        region: "localhosts",
        endpoint: "http://0.0.0.0:8000",
        accessKeyId: "DEFAULT",
        secretAccessKey: "DEFAULT",
    };

}

const client = new DynamoDBClient(dynamoDBClientParams);

const handler = async (event, context) => {
    try {
        const song = JSON.parse(event.body);
        song.id = uuidv4();
        const createdBy = "user1";

        const links = song.links.map(link => ({
            M: {
                url: { S: link.url },
                platform: { S: link.platform },
            }
        }));

        const utcNow = new Date();

        // Ajustar la diferencia de tiempo para Lima (UTC-5)
        const limaOffset = -5 * 60 * 60 * 1000; // 5 horas en milisegundos
        const limaTime = new Date(utcNow.getTime() + limaOffset);
        const formattedDatetime = limaTime.toISOString().replace("T", " ").replace(/\.\d+Z$/, "");


        const item = {
            id: { S: song.id },
            title: { S: song.title },
            spanishLyrics: { S: song.spanishLyrics },
            quechuaLyrics: { S: song.quechuaLyrics },
            artist: { S: song.artist },
            genre: { S: song.genre },
            links: { L: links },
            createdBy: { S: createdBy },
            createdAt: { S: formattedDatetime }
        };

        const command = new PutItemCommand({
            TableName: process.env.SONGS_TABLE_NAME,
            Item: item,
        });

        const response = await client.send(command);

        if (response.$metadata.httpStatusCode !== 200) {
            return {
                statusCode: 400,
                body: JSON.stringify(
                    {
                        message: 'Upps! ocurrió un error inesperado, intente nuevamente',
                    }
                ),
            };
        }

        return {
            statusCode: 201,
            body: JSON.stringify(
                {
                    message: 'Canción creada exitosamente!',
                    data: song
                }
            ),
        };

    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: JSON.stringify(
                {
                    message: 'Error interno del servidor, intente nuevamente',
                }
            ),
        };
    }
};

export {
    handler
}