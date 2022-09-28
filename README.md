# World cup card detector

The [card list](./data/cards.txt) was extracted from [CardBoardConnection](https://www.cardboardconnection.com/2022-panini-world-cup-stickers-qatar-cards).

### Set up

1. It's required to update [config](./config/storage.json) with a proper Google Cloud key that is able to access Storage and Vision API's.

2. It's also required to create a bucket in cloud storage to store uploaded images.

3. Copy the `.env.local.example` file in this directory to `.env.local` (which will be ignored by Git):

```bash
cp .env.local.example .env.local
```

Then, open `.env.local` and set the name of the bucket that you created in step 2.

4. Use the following comand to run the app.

```bash
yarn dev
```
