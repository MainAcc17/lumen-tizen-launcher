#!/usr/bin/env python3
"""
Create a Tizen *author* certificate signed by the Tizen Developers CA that ships with
Tizen Studio (the same thing `tizen certificate` does locally), but with a SHA-256
signature instead of SHA-512, because Tizen 2.3/2.4 TVs reject SHA-512.

Usage: make_author_cert.py CA_KEY.pem CA_KEY_PASS CA_CERT.cer OUT_DIR NAME
"""
import datetime, os, sys
from cryptography import x509
from cryptography.x509.oid import NameOID, ExtendedKeyUsageOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa

ca_key_path, ca_pass, ca_cert_path, out_dir, name = sys.argv[1:6]
ca_key = serialization.load_pem_private_key(open(ca_key_path, "rb").read(), ca_pass.encode())
raw = open(ca_cert_path, "rb").read()
ca_cert = (x509.load_pem_x509_certificate(raw[raw.index(b"-----BEGIN"):])
           if b"-----BEGIN" in raw else x509.load_der_x509_certificate(raw))

key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
now = datetime.datetime.now(datetime.timezone.utc)
cert = (x509.CertificateBuilder()
        .subject_name(x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, name)]))
        .issuer_name(ca_cert.subject)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - datetime.timedelta(days=2))
        .not_valid_after(ca_cert.not_valid_after_utc)
        .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
        .add_extension(x509.KeyUsage(True, False, False, False, False, False, False, False, False), critical=False)
        .add_extension(x509.ExtendedKeyUsage([ExtendedKeyUsageOID.CODE_SIGNING]), critical=False)
        .sign(ca_key, hashes.SHA256()))

os.makedirs(out_dir, exist_ok=True)
with open(os.path.join(out_dir, "author-key.pem"), "wb") as fh:
    fh.write(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
                               serialization.NoEncryption()))
with open(os.path.join(out_dir, "author-cert.pem"), "wb") as fh:
    fh.write(cert.public_bytes(serialization.Encoding.PEM))
print("Author certificate:", cert.subject.rfc4514_string(), "| valid until", cert.not_valid_after_utc,
      "| signed with", cert.signature_hash_algorithm.name)
