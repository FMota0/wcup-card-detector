# World Cup Card Detector

## Application

The idea from this project came from friends that talked about how hard it's to quickly exchange cards from the world cup. Well, one simple idea for that would be using Cloud Vision that detects the text and with the text identifying the player. Which should be pretty straighforward. After identifying with the image we should be able to quickly transfer this data and figure out a good exchange between two persons.

Only the first step was implemented (being able to identify cards with images).

As a challenge, the implementation was made using a small number of dependency packages and without using some web frameworks (like Next.js, Gatsby, ...). There are only two pages in the application, one to allow users to upload their images and one to show the detected players in a image.

![Usage in mobile](/docs/demovid.gif)

It turned out that not using some framework wasn't the most enjoyable experience, but at least the page quality was high without much effort.
![Web Dev Measure report](/docs/webdev.png)

The application is currently available through [Render Deploy](https://wcup-card-detector.onrender.com/)

The [card list](./data/cards.txt) was extracted from [CardBoardConnection](https://www.cardboardconnection.com/2022-panini-world-cup-stickers-qatar-cards).

Part of the development was made in live through YouTube:
- [Part 1](https://youtu.be/wjrLHMrP820)
- [Part 2](https://youtu.be/7eU2TuP32uc)
- [Part 3](https://youtu.be/UgreNPqTetc)

Thanks to @MatzCouz for helping with ideas related to the aplication and during the lives.

## Set up

1. Get a [Google Cloud Service Account Key](https://cloud.google.com/iam/docs/service-accounts) that has access to Cloud Vision and Cloud Storage.

2. It's also required to create a bucket in cloud storage to store uploaded images.

3. Copy the `.env.example` file in this directory to `.env` (which will be ignored by Git):

```bash
cp .env.example .env
```

Then, open `.env` and set the name of the bucket that you created in step 2.
Also, set the `KEY_PATH` variable with the path to where your service account is stored (created in step 1).

4. Use the following comand to run the app.

```bash
yarn dev
```
