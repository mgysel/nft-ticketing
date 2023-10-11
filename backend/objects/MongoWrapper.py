from pymongo import MongoClient
import json
class CredentialsError(Exception):
    def __init__(self, message):
        self.message = message

class MongoWrapper:
    '''
    Wrapper class for ensuring one instance of MongoClient client, as per the Borg pattern.
    Credentials file is checked for valid properties.
    '''
    __shared_state = {}
    def __init__(self):
        self.__dict__ = self.__shared_state
        try:
            with open('credentials/credentials.json', 'r') as creds_file:
                credentials = json.load(creds_file)
            if "username" not in credentials or "password" not in credentials or "connection_string" not in credentials:
                raise CredentialsError("Credentials file not valid")
            else:
                connection_string = credentials['connection_string'].replace('{{username}}', credentials['username']).replace('{{password}}', credentials['password'])
                self.client = MongoClient(connection_string)
        except:
            raise CredentialsError("Credentials file not valid")