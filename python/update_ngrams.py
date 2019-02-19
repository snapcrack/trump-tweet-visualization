import pandas as pd
import re
import datetime
import tweet_functions
import sys

def update_ngrams():
    tweets = tweet_functions.tweets()
    tweets_df = pd.read_pickle('trump_tweets.pickle')

    year = datetime.date.today().year
    month = datetime.date.today().month

    current_df = tweets_df.copy()
    current_df = current_df[(current_df['created_at'].apply(lambda x: x.year == year)) & (current_df['created_at'].apply(lambda x: x.month == month))]

    #running function
    text = ' '.join(e for e in current_df['full_text']).lower()

    bigrams = tweets.get_ngrams(3, text)

    bigram_df = pd.DataFrame.from_dict(bigrams.most_common())
    bigram_df['grams'] = bigram_df[0]
    bigram_df['count'] = bigram_df[1]
    del bigram_df[0]
    del bigram_df[1]

    #bigram_df = bigram_df[bigram_df['count'] > 10]

    #updating data

    current_df['full_text_regex'] = current_df['full_text'].apply(lambda x: re.sub(r'[^ a-zA-Z0-9@\&]', '', x))
    current_df['full_text_regex'] = current_df['full_text_regex'].apply(lambda x: re.sub(r' {1,}', ' ', x))



    ctr = 0

    for index, row in bigram_df.iterrows():
        gram = bigram_df.loc[index, 'grams']
        df = current_df[current_df['full_text_regex'].str.contains(gram, case=False)]
        try:

        #bigram_df.loc[index, 'sentiment'] = df.loc[0, 'seniment']
            bigram_df.loc[index, 'retweets'] = df['retweet_count'].mean()
            bigram_df.loc[index, 'favorites'] = df['favorited_count'].mean()
        except:
            print ('AKSHDSAKD')
            print (gram, df)

        ctr += 1
        sys.stdout.write('\r{}'.format(ctr))


    bigram_df.to_csv('bigram_test.csv')

if __name__ == '__main__':
    update_ngrams()