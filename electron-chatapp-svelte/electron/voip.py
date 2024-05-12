import base64
from hashlib import sha256
import json
import socket
import sys

import base64
import json
import struct
from Crypto.Cipher import PKCS1_OAEP
from Crypto.PublicKey import RSA

from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes

print(sys.argv)


USER_TOKEN = sys.argv[1]
USER_ID = sys.argv[2]
CALL_ID = sys.argv[3]
AES_KEY = sys.argv[4]
AES_KEY = base64.b64decode(AES_KEY)

print("aes key is::::")
print(AES_KEY)
print("stopping printing aes key::::::::")

UDP_IP = "192.168.1.99"
UDP_PORT = 12000
MESSAGE = "Hello, World!"

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.sendto(MESSAGE.encode(), (UDP_IP, UDP_PORT))
print("sent socket msg!!!!!!!!!!!!!!!!!")

def decrypt_from_json_string(json_data_string):
    json_data = json.loads(json_data_string)
    iv = base64.b64decode(json_data["aes_iv"])
    auth_tag = base64.b64decode(json_data["auth_tag"])
    encrypted = base64.b64decode(json_data["encrypted_data"])
    cipher_object = AES.new(AES_KEY, mode=AES.MODE_GCM, nonce=iv)
    decryptedtext = cipher_object.decrypt(encrypted)
    cipher_object.verify(auth_tag)
    return decryptedtext.decode()

def encrypt_to_json_string(data):
    iv = get_random_bytes(12)
    cipher_object = AES.new(AES_KEY, mode=AES.MODE_GCM, nonce=iv)
    ciphertext, auth_tag = cipher_object.encrypt_and_digest(data)
    print(auth_tag)
    json_data = {
        "aes_iv": base64.b64encode(iv).decode(),
        "auth_tag": base64.b64encode(auth_tag).decode(),
        "encrypted_data": base64.b64encode(ciphertext).decode()
    }
    return json.dumps(json_data)

def encrypt_to_json(data):
    iv = get_random_bytes(12)
    cipher_object = AES.new(AES_KEY, mode=AES.MODE_GCM, nonce=iv)
    ciphertext, auth_tag = cipher_object.encrypt_and_digest(data)
    print(auth_tag)
    json_data = {
        "aes_iv": base64.b64encode(iv).decode(),
        "auth_tag": base64.b64encode(auth_tag).decode(),
        "encrypted_data": base64.b64encode(ciphertext).decode()
    }
    return json_data

#handshake with server - identify callid and make sure encryption is working
message = {"call_id" : CALL_ID, "user_id" : USER_ID, "user_token" : USER_TOKEN, "type" : "subscribe-call"}
message_json = encrypt_to_json(json.dumps(message).encode())
print(message_json)
message_json["token_hash"] = sha256(USER_TOKEN.encode('utf-8')).hexdigest()
print(message_json)
message_json = json.dumps(message_json)
print(message_json)
sock.sendto(message_json.encode(), (UDP_IP, UDP_PORT))