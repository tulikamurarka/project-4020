const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const path = require('path');

dotenv.config();

const app = express();
const PORT = 3000;
const mongoURL = process.env.MONGO_URL;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));


// MongoDB Connection
mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB:', err));

// OpenAI Configuration
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(express.json());

// to keep the pretty-print on
app.set('json spaces', 2);

// Routes
app.get('/', (req,res) => {
    res.sendFile('./views/index.html', {root:__dirname});
})

// Fetch questions
const SocialScience = require('./models/social_Science');
const History = require('./models/history');
const ComputerSecurity = require('./models/computer_Security');


app.get('/retrieveQuestions/:collection', async (req, res) => {

    var collection = req.params.collection;

    try {
        switch (collection.toLowerCase()) {
            
            // Retrieve questions from collection Social_Science
            case "socialscience":
                SocialScience.find({}, 'question -_id')
                    .then((result) => {
                        res.send(result);
                    })
                break;
            
            // Retrieve questions from collection History
            case "history":
                History.find({}, 'question -_id')
                    .then((result) => {
                        res.send(result);
                    })
                break;

            // Retrieve questions from collection Computer_Security
            case "computersecurity":
                ComputerSecurity.find({}, 'question -_id')
                    .then((result) => {
                        res.send(result);
                    })
                break;
            
            //Retrieve ALL questions of the Database
            case "all":
                const [socialScienceQuestions, historyQuestions, computerSecurityQuestions] = await Promise.all([
                    SocialScience.find({}, 'question -_id'),
                    History.find({}, 'question -_id'),
                    ComputerSecurity.find({}, 'question -_id')
                ]);
                const allQuestions = {
                    SocialScience: socialScienceQuestions,
                    History: historyQuestions,
                    ComputerSecurity: computerSecurityQuestions
                };
                // Send a single response
                res.status(200).json(allQuestions);
                break;

            default:
                return res.status(400).send({ error: "Invalid collection name." });
        }
    }
    catch (error) {
        console.error("Error retrieving questions:", error);
        res.status(500).send({ error: "Failed to retrieve questions." });
    }

})

var averageResponseTimeForSocialScienceCollection;
var averageResponseTimeForHistoryCollection;
var averageResponseTimeForComputerSecurityCollection;

var model;
// Process and Store
app.get('/processQuestions/:collection/:model', async (req, res) => {

    if (req.params.model === "4o-mini") {
        model = 'gpt-4o-mini';
    }
    else if (req.params.model === "4o") {
        model = 'gpt-4o';
    }

    res.setHeader('Content-Type', 'text/event-stream');

    res.write(`Using ${model}\n\n`);

    var collection = req.params.collection;

    try {
        switch (collection.toLowerCase()) {
            case "socialscience": {
                await processSocialScienceQuestions(res, model);
                res.end();
                break;
            }
            case "history": {
                await processHistoryQuestions(res, model);
                res.end();
                break;
            }
            case "computersecurity": {
                await processComputerSecurityQuestions(res, model);
                console.log(averageResponseTimeForComputerSecurity);
                res.end();
                break;
            }
            case "all": {
                await processSocialScienceQuestions(res, model);
                await processHistoryQuestions(res, model);
                await processComputerSecurityQuestions(res, model);
                res.end();
                break;
            }
            default:
                return res.status(400).send({ error: "Invalid collection name." });

        }
    } catch (error) {
        console.error('Error processing questions:', error);
        res.status(500).send('Error processing questions.');
    }
});

async function processSocialScienceQuestions(res, model) {
    let results = [];
    console.log("Processing Social Science questions...");
    res.write("Processing SocialScience questions...\n\n");
    const sciences = await SocialScience.find({}, 'question anticipated_Answer multipleChoices');

    for (const science of sciences) {
        const { question, multipleChoices, _id, anticipated_Answer } = science;
        
        // Record start time chatGPT's response
        const startTime = performance.now();

        // Send question and choices to ChatGPT
        res.write(`Question: ${question}\n\n`);
        const chatGPTResponse = await getChatGPTResponse(question, multipleChoices, model);
        res.write(`ChatGPT responded with: ${chatGPTResponse}\n\n`);
        res.write(`Anticipated answer was: ${anticipated_Answer}\n\n`)

        // Record end time of the response
        const endTime = performance.now();
        
        // Record how long did the response take
        const responseTime = endTime - startTime;

        const result = {
            _id,
            question,
            responseTime,
        };

        results.push(result);

        // Update database with ChatGPT response
        await SocialScience.findByIdAndUpdate(_id, { chatGPT_Response: chatGPTResponse });
    };
    console.log("Done Processing")
    // console.log(results);
    averageResponseTimeForSocialScienceCollection = calculateAverageResponseTime(results);
    res.write("Responses saved to collection Social_Science\n\n");
    res.write(`"Average Response Time: ${averageResponseTimeForSocialScienceCollection} ms"\n\n`);

}

async function processHistoryQuestions(res, model) {
    let results = [];
    console.log("Processing History questions...");
    res.write("Processing History questions...\n\n");
    const histories = await History.find({}, 'question anticipated_Answer multipleChoices');

    for (const history of histories) {
        const { question, multipleChoices, _id, anticipated_Answer } = history;

        // Record start time chatGPT's response
        const startTime = performance.now();

        // Send question and choices to ChatGPT
        res.write(`Question: ${question}\n\n`);
        const chatGPTResponse = await getChatGPTResponse(question, multipleChoices, model);
        res.write(`ChatGPT responded with: ${chatGPTResponse}\n\n`);
        res.write(`Anticipated answer was: ${anticipated_Answer}\n\n`)

        // Record end time of the response
        const endTime = performance.now();
        
        // Record how long did the response take
        const responseTime = endTime - startTime;

        const result = {
            _id,
            question,
            responseTime,
        };

        results.push(result);

        // Update database with ChatGPT response
        await History.findByIdAndUpdate(_id, { chatGPT_Response: chatGPTResponse });
    };
    console.log("Done Processing")
    // console.log(results);
    averageResponseTimeForHistoryCollection = calculateAverageResponseTime(results);
    res.write("Responses saved to collection History\n\n");
    res.write(`"Average Response Time: ${averageResponseTimeForHistoryCollection} ms"\n\n`);
}
async function processComputerSecurityQuestions(res, model) {
    let results = [];
    console.log("Processing Computer Security questions...");

    const securities = await ComputerSecurity.find({}, 'question anticipated_Answer multipleChoices');

    for (const security of securities) {
        const { question, multipleChoices, _id, anticipated_Answer } = security;

        // Record start time for ChatGPT's response
        const startTime = performance.now();

        // Send question and choices to ChatGPT
        res.write(`Question: ${question}\n\n`);
        const chatGPTResponse = await getChatGPTResponse(question, multipleChoices, model);
        res.write(`ChatGPT responded with: ${chatGPTResponse}\n\n`);
        res.write(`Anticipated answer was: ${anticipated_Answer}\n\n`)

        // Record end time of the response
        const endTime = performance.now();
        
        // Calculate response time
        const responseTime = endTime - startTime;

        const result = {
            _id,
            question,
            responseTime,
        };

        results.push(result);

        // Update database with ChatGPT response
        await ComputerSecurity.findByIdAndUpdate(_id, { chatGPT_Response: chatGPTResponse });
    }
    console.log("Done Processing");
    // Calculate average response time
    averageResponseTimeForComputerSecurityCollection = calculateAverageResponseTime(results);
    res.write("Responses saved to collection Computer_Security\n\n");
    res.write(`Average Response Time: ${averageResponseTimeForComputerSecurityCollection} ms\n\n`);
}

// Function to interact with OpenAI API
async function getChatGPTResponse(question, multipleChoices, model_name) {
    const prompt = `
        Question: ${question}
        Multiple Choices:
        ${multipleChoices.map((choice, index) => `${String.fromCharCode(65 + index)}. ${choice}`).join('\n')}
        
        Answer with only the letter (A, B, C, D) corresponding to the correct choice. Do not provide any explanation.
    `;

    try {
        const response = await openai.chat.completions.create({
            model: model_name,
            messages: [{ role: 'user', content: prompt }],
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error calling ChatGPT API:', error);
        return 'Error in generating response';
    }
}

function calculateAverageResponseTime(results) {
    if (results.length === 0) return 0; // Avoid division by zero

    const totalResponseTime = results.reduce((sum, result) => sum + result.responseTime, 0);
    return parseFloat((totalResponseTime / results.length).toFixed(2));                                                             
}


app.get('/validate/Responses', async (req, res) => {

    try {
        const [socialScienceDocuments, historyDocuments, computerSecurityDocuments] = await Promise.all([
            SocialScience.find({}, 'anticipated_Answer chatGPT_Response -_id'),
            History.find({}, 'anticipated_Answer chatGPT_Response -_id'),
            ComputerSecurity.find({}, 'anticipated_Answer chatGPT_Response -_id')])

        function countCorrectAnswers(documents) {
            return documents.filter(doc => doc.anticipated_Answer === doc.chatGPT_Response).length;
        }

        const socialScienceCorrect = countCorrectAnswers(socialScienceDocuments);
        const historyCorrect = countCorrectAnswers(historyDocuments);
        const computerSecurityCorrect = countCorrectAnswers(computerSecurityDocuments);

        const totalCorrect = socialScienceCorrect + historyCorrect + computerSecurityCorrect;
        // res.send(__dirname);
        res.render('visualization', {socialScienceCorrect, historyCorrect, computerSecurityCorrect, totalCorrect, 
                                     averageResponseTimeForSocialScienceCollection,
                                     averageResponseTimeForHistoryCollection,
                                     averageResponseTimeForComputerSecurityCollection,
                                     model
                                    });
                    
        // res.json({
        //     socialScienceCorrect,
        //     historyCorrect,
        //     computerSecurityCorrect,
        //     totalCorrect
        // }); 
    }

    catch (error) {
        console.error("Error validating responses:", error);
        res.status(500).send({ error: "Failed to validate responses." });
    }

})



// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
