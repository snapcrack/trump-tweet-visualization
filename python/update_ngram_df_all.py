#getting multiindex df for all ngrams
import pandas as pd
import re
import sys
import tweet_functions

tweets = tweet_functions.tweets()
tweets_df = pd.read_
ngram_df = pd.read_pickle('ngram_df_all.pickle')

tweets_df['month'] = tweets_df['created_at'].apply(lambda x: x.month)
tweets_df['year'] = tweets_df['created_at'].apply(lambda x: x.year)

