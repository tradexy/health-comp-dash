# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## QUICK
# On personalized-healthcare-alert-system folder:
# make sure that Docker is running (if needed docker-compose down or docker-compose down -v )
docker-compose up -d

# then on another terminal cd on personalized-healthcare-alert-system\server:
npm install
npm run dev

# the back on personalized-healthcare-alert-system on another:
npm install
npm run dev

# After testing to check mongo with mongosh
mongosh mongodb://localhost:27017
use healthcompanion
show collections
db.users.find().limit(5).pretty()
db.healthdata.find().limit(5).pretty()
db.behaviorallogs.find().limit(5).pretty()

