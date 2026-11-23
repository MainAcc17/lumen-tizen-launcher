#!/usr/bin/env python3
"""Verify a Tizen widget signature file (any of sha256/sha512) against the app files.
Usage: verify_sig.py SIGNATURE.xml APP_DIR"""
import base64, hashlib, os, sys
from urllib.parse import unquote
from lxml import etree
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding

D = "{http://www.w3.org/2000/09/xmldsig#}"
H = {"sha256": (hashlib.sha256, hashes.SHA256()), "sha512": (hashlib.sha512, hashes.SHA512())}
sig_path, app = sys.argv[1], sys.argv[2]
doc = etree.parse(sig_path).getroot()
si = doc.find(D + "SignedInfo")
alg = si.find(D + "SignatureMethod").get("Algorithm").rsplit("-", 1)[-1]
ok = True
for ref in si.findall(D + "Reference"):
    uri = ref.get("URI")
    h = H[ref.find(D + "DigestMethod").get("Algorithm").rsplit("#", 1)[-1]][0]
    if uri == "#prop":
        import re
        raw = open(sig_path, "rb").read()
        data = re.search(rb"<Object.*?</Object>", raw, re.S).group(0).replace(
            b"<Object ", b'<Object xmlns="http://www.w3.org/2000/09/xmldsig#" ', 1)
    else:
        data = open(os.path.join(app, unquote(uri)), "rb").read()
    good = base64.b64encode(h(data).digest()).decode() == "".join(ref.find(D + "DigestValue").text.split())
    ok &= good
    print(("OK  " if good else "BAD ") + uri)
certs = [x509.load_der_x509_certificate(base64.b64decode("".join(e.text.split())))
         for e in doc.iter(D + "X509Certificate")]
try:
    certs[0].public_key().verify(base64.b64decode("".join(doc.find(D + "SignatureValue").text.split())),
                                 etree.tostring(si, method="c14n", exclusive=True),
                                 padding.PKCS1v15(), H[alg][1])
    print("OK  SignatureValue (%s)" % alg)
except Exception as e:
    ok = False
    print("BAD SignatureValue", e)
try:
    certs[1].public_key().verify(certs[0].signature, certs[0].tbs_certificate_bytes,
                                 padding.PKCS1v15(), certs[0].signature_hash_algorithm)
    print("OK  signer cert chains to", certs[1].subject.rfc4514_string(),
          "| cert signed with", certs[0].signature_hash_algorithm.name)
except Exception as e:
    ok = False
    print("BAD chain", e)
print("RESULT:", "VALID" if ok else "INVALID")
