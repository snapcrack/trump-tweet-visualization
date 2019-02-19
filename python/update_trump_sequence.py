import dropbox
import datetime
import os
dbx = dropbox.Dropbox('DROPBOX KEY HERE')

os.system('python update_tweets.py')

with open('as_of_date.txt', 'w') as f:
    f.write(str(datetime.datetime.now()))

os.system('python update_sentiment.py')

os.system('python update_ngrams_month.py')

os.system('python update_mentions_and_hashtags.py')


with open('trump_tweets.pickle', 'rb') as f:
    dbx.files_upload(f.read(), '/trump_tweets.pickle', mode=dropbox.files.WriteMode.overwrite, mute=True)

with open('trump_tweets.csv', 'rb') as f:
    dbx.files_upload(f.read(), '/trump_tweets.csv', mode=dropbox.files.WriteMode.overwrite, mute=True)

with open('ngram_df_all_flattened.csv', 'rb') as f:
    dbx.files_upload(f.read(), '/trump viz/ngram_df_all_flattened.csv', mode=dropbox.files.WriteMode.overwrite, mute=True)

with open('bigram_month.csv', 'rb') as f:
    dbx.files_upload(f.read(), '/trump viz/bigram_month.csv', mode=dropbox.files.WriteMode.overwrite, mute=True)

with open('hashtag_df_flattened.csv', 'rb') as f:
    dbx.files_upload(f.read(), '/trump viz/hashtag_df_flattened.csv', mode=dropbox.files.WriteMode.overwrite, mute=True)

with open('hashtag_df.csv', 'rb') as f:
    dbx.files_upload(f.read(), '/trump viz/hashtag_df.csv', mode=dropbox.files.WriteMode.overwrite, mute=True)

with open('mention_df_flattened.csv', 'rb') as f:
    dbx.files_upload(f.read(), '/trump viz/mention_df_flattened.csv', mode=dropbox.files.WriteMode.overwrite, mute=True)

with open('mention_df.csv', 'rb') as f:
    dbx.files_upload(f.read(), '/trump viz/mention_df.csv', mode=dropbox.files.WriteMode.overwrite, mute=True)

with open('as_of_date.txt', 'rb') as f:
    dbx.files_upload(f.read(), '/trump viz/as_of_date.txt', mode=dropbox.files.WriteMode.overwrite, mute=True)