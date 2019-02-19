

##calculating sentiment
import pandas as pd
import os
os.environ["GOOGLE_APPLICATION_CREDENTIALS"]="GOOGLE CREDENTIALS HERE"

from google.cloud import language
from google.cloud.language import enums
from google.cloud.language import types
client = language.LanguageServiceClient()

def get_sentiment(string):
    
    try:
        text = u'{}'.format(string) #' '.join(e.text for e in driver.find_elements_by_tag_name('p'))
        document = types.Document(
            content=text,
            type=enums.Document.Type.PLAIN_TEXT)

        # Detects the sentiment of the text
        sentiment = client.analyze_sentiment(document=document).document_sentiment

        #print('Text: {}'.format(text))
        #print('Sentiment: {}'.format(sentiment.score))
        return sentiment.score
    except:
        return 0

#getting index for tweets with no sentiment score
tweets_df = pd.read_pickle('trump_tweets.pickle')
unclassified_sentiment = tweets_df[tweets_df['sentiment'].isnull()].index
tweets_df.loc[unclassified_sentiment, 'sentiment'] = tweets_df.loc[unclassified_sentiment, 'full_text'].apply(get_sentiment)

tweets_df.to_pickle('trump_tweets.pickle')

print (len(tweets_df[tweets_df['sentiment'].isnull()]), 'sentiment done')

#making the CSV for upload

copy_df = tweets_df.applymap(lambda x: str(x))

copy_df['hashtags'] = copy_df['hashtags'].apply(lambda x: x.strip("[").strip("]"))
copy_df['hashtags'] = copy_df['hashtags'].str.replace(r"\'", '')

copy_df['mentions'] = copy_df['mentions'].apply(lambda x: x.strip("[").strip("]"))
copy_df['mentions'] = copy_df['mentions'].str.replace(r"\'", '')

copy_df.to_csv('trump_tweets.csv', quoting=1)
