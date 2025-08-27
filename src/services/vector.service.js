const { Pinecone } = require('@pinecone-database/pinecone')


const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const ownGPT = pc.index('own-gpt');

async function createVectorMemory({ vectors, metadata, messageId }) {
    await ownGPT.upsert([{
        id: messageId,
        values: vectors, 
        metadata: metadata
    }]);
};

async function queryVectorMemory({ queryvector, limit = 5, metadata }) {
    const data = ownGPT.query({
        vector: queryvector,
        topK: limit,
        filter: metadata ?  metadata : undefined,
        includeMetadata: true
    });

    return data.matches;
};


module.exports = {
    createVectorMemory,
    queryVectorMemory
};