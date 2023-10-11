from flask import Flask, request, redirect, url_for
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
# imports for PyJWT authentication
import jwt
from json import dumps, load
import sys
from flask.json import jsonify
import json
from flask.helpers import make_response
import pymongo
from pymongo import MongoClient
from objects.MongoWrapper import MongoWrapper


APP = Flask(__name__)
# Allows cross-origin AJAX, so React can talk to this API
CORS(APP)

APP.config['SECRET_KEY'] = 'your secret key'

########## EVENT ROUTES ##########
@APP.route('/resetDatabase', methods=['GET'])
def resetDatabase_get():
    '''
    Delete all records from the two database tables we use
    '''
    # Get all events 
    db = MongoWrapper().client['ticket_chain_store']
    coll = db['usedTicket']
    coll.remove()
    coll = db['newTicket']
    coll.remove()

    return make_response(
        'Database cleaned', 
        200
    ) 

@APP.route('/ticket/add', methods=['POST'])
def newticket_add():
    '''
    Given a smart contract ID, event name, venue, ticket price
    Adds event to database
    '''
    data = request.get_json()
    fields = ['contractAddress', 'eventName', 'userAddress',  'ticketId']
    for field in fields:
        if not field in data:
            return make_response(
                dumps(
                    {"message": "No contractAddress, eventName, userAddress or ticketId parameters."}
                ),
                400
            )

    contract_Address = data['contractAddress']
    event_name = data['eventName']
    user_Address = data['userAddress']
    ticket_Id = data['ticketId']
    print(event_name)
    print(user_Address)
    print(ticket_Id)

    code_json = {
        'contract_Address': contract_Address,
        'event_name': event_name,
        'user_Address': user_Address,
        'ticket_Id': ticket_Id
    }

    db = MongoWrapper().client['ticket_chain_store']
    coll = db['newTicket']
    coll.insert_one(code_json)

    return make_response(
        dumps(
            {
                "result": "success",
            }
        ), 
        201
    ) 

@APP.route('/ticket/query', methods=['GET'])
def newticket_get():
    '''
    Returns tickets for a user
    '''
    # Get eventName and useraddress, 400 eror if parameters not in args
    event_name = request.args.get('eventName')
    user_Address = request.args.get('userAddress')
    if user_Address is None:    
        return make_response(
        dumps(
            {"message": "user_Address."}
        ),
        400
    )

    # Get all events
    db = MongoWrapper().client['ticket_chain_store']
    #coll = db['UsedTicket']
    #coll.remove()
    coll = db['newTicket']
    #coll.remove()
    code_json = coll.find({ 'user_Address': user_Address })
    list_cursor = list(code_json)
    
    arrOutput = []
    for oRec in list_cursor:
        arrOutput.append({'contractAddress': oRec['contract_Address'],
                            'eventName': oRec['event_name'],
                            'userAddress': oRec['user_Address'],
                            'ticketID': oRec['ticket_Id']})
    print("Array Output", arrOutput)
    return make_response(
        dumps(arrOutput), 
        200
    ) 

@APP.route('/ticket/update', methods=['PUT'])
def ticket_update():
    '''
    Given a smart contract ID, event name, venue, ticket price
    Adds event to database
    '''
    data = request.get_json()
    fields = ['contractAddress', 'eventName', 'userAddress',  'ticketId']
    for field in fields:
        if not field in data:
            return make_response(
                dumps(
                    {"message": "No contractAddress, eventName, userAddress or ticketId parameters."}
                ), 
                400
            ) 

    contract_Address = data['contractAddress']
    event_name = data['eventName']
    user_Address = data['userAddress']
    ticket_Id = data['ticketId']
    print(event_name)
    print(user_Address)
    print(ticket_Id)
    
    code_json = {
        'contract_Address': contract_Address,
        'event_name': event_name,
        'user_Address': user_Address,
        'ticket_Id': ticket_Id
    }

    db = MongoWrapper().client['ticket_chain_store']
    coll = db['newTicket']
    coll.find_one_and_update({ 'ticket_Id': ticket_Id }, { '$set': { 'user_Address' : user_Address } })

    return make_response(
        dumps(
            {
                "result": "success",
            }
        ), 
        201
    )   
    
############################
#QR Code Functionality start
############################
    
@APP.route('/usedticket/add', methods=['POST'])
def usedticket_add():
    '''
    Given a smart contract ID, event name, venue, ticket price
    Adds event to database
    '''
    data = request.get_json()
    print(data)
    fields = ['userAddress','contractAddress', 'ticketId', 'eventName', 'qrCode']
    for field in fields:
        if not field in data:
            return make_response(
                dumps(
                    {"message": "No contractAddress, ticketId, eventName or qrCode parameters."}
                ), 
                400
            )
    user_Address = data['userAddress']
    contract_Address = data['contractAddress']
    ticket_Id = data['ticketId']
    event_name = data['eventName']
    qr_code = data['qrCode']
    print(qr_code)
    
    code_json = {
        'user_Address': user_Address,
        'event_name': event_name,
        'qr_code': qr_code
    }

    db = MongoWrapper().client['ticket_chain_store']
    coll = db['usedTicket']
    coll.insert_one(code_json)
    
    # Remove the record from the other table
    code_json = {
        'contract_Address': contract_Address,
        'ticket_Id': ticket_Id
    }
    coll = db['newTicket']
    coll.remove(code_json)

    return make_response(
        dumps(
            {
                "result": "success",
            }
        ), 
        201
    ) 


@APP.route('/usedticket/query', methods=['GET'])
def usedticket_get():
    '''
    Returns True if QR Code is valid, false otherwise
    '''
    # Get eventName and qrCode, 400 eror if parameters not in args
    user_Address = request.args.get('userAddress')
    event_name = request.args.get('eventName')
    qr_code = request.args.get('qrCode')
    
     # Get all events 
    db = MongoWrapper().client['ticket_chain_store']
    coll = db['usedTicket']
    if request.args.get('userAddress') is None:
        return make_response(
                dumps(
                    {"message": "No userAddress parameters."}
                ), 
                400
            )

    if request.args.get('eventName') is None and request.args.get('qrCode') is None:
        code_json = coll.find({ 'user_Address': user_Address })
        list_cursor = list(code_json)
        print(list_cursor)
        arrOutput = []
        for oRec in list_cursor:
            arrOutput.append({'eventName': oRec['event_name'],
                                'qrCode': oRec['qr_code'],
                                'userAddress': oRec['user_Address']})
        print("Array Output", arrOutput)
        return make_response(
            dumps(arrOutput), 
            200
        )

    else:
        code_json = coll.find_one({ 'event_name': event_name, 'qr_code': qr_code,
                                    'user_Address': user_Address})
        if code_json:
            result = True
        else:
            result = False
    
        return make_response(
            dumps(
                {
                    "result": result,
                }
            ), 
            200
        ) 

if __name__ == "__main__":
    APP.run(port=(int(sys.argv[1]) if len(sys.argv) == 2 else 2122), debug=True)