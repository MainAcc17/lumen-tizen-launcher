#!/usr/bin/env python3
"""
Build and sign a Tizen web app (.wgt) with SHA-256 signatures, for Samsung 2015-2016 TVs
(Tizen 2.3 / 2.4), whose web runtime cannot verify the SHA-512 signatures that current
Tizen Studio versions produce.

Produces the same W3C "XML Digital Signatures for Widgets" layout as Tizen Studio:
  author-signature.xml  (author key + Tizen Developers CA)
  signature1.xml        (Tizen public distributor key + its CA)
only with rsa-sha256 / sha256 everywhere.

Usage:
  sign_wgt.py --src DIR --out FILE.wgt --author-key KEY.pem --author-cert CERT.pem
              --dev-ca CA.cer --dist-p12 DIST.p12 --dist-pass PASS
"""
import argparse, base64, hashlib, os, zipfile
from urllib.parse import quote
from lxml import etree
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import pkcs12

DSIG = "http://www.w3.org/2000/09/xmldsig#"
SKIP = {"author-signature.xml", "signature1.xml", ".manifest.tmp", ".delta.lst"}


def b64(data, wrap=76):
    s = base64.b64encode(data).decode()
    return "\n".join(s[i:i + wrap] for i in range(0, len(s), wrap))


def cert_b64(cert):
    return b64(cert.public_bytes(serialization.Encoding.DER))


def list_files(src):
    out = []
    for root, dirs, files in os.walk(src):
        dirs[:] = sorted(d for d in dirs if not d.startswith("."))
        for f in sorted(files):
            rel = os.path.relpath(os.path.join(root, f), src).replace(os.sep, "/")
            if rel in SKIP or f.startswith(".") or f.endswith(".wgt"):
                continue
            out.append(rel)
    return out


def build_signature(src, files, sig_id, role, key, certs):
    refs = []
    for rel in files:
        with open(os.path.join(src, rel), "rb") as fh:
            digest = base64.b64encode(hashlib.sha256(fh.read()).digest()).decode()
        refs.append(
            '<Reference URI="%s">\n'
            '<DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></DigestMethod>\n'
            "<DigestValue>%s</DigestValue>\n"
            "</Reference>\n" % (quote(rel, safe="/"), digest))

    obj = ('<Object Id="prop"><SignatureProperties xmlns:dsp="http://www.w3.org/2009/xmldsig-properties">'
           '<SignatureProperty Id="profile" Target="#%(id)s"><dsp:Profile URI="http://www.w3.org/ns/widgets-digsig#profile"></dsp:Profile></SignatureProperty>'
           '<SignatureProperty Id="role" Target="#%(id)s"><dsp:Role URI="http://www.w3.org/ns/widgets-digsig#role-%(role)s"></dsp:Role></SignatureProperty>'
           '<SignatureProperty Id="identifier" Target="#%(id)s"><dsp:Identifier></dsp:Identifier></SignatureProperty>'
           "</SignatureProperties></Object>") % {"id": sig_id, "role": role}

    template = (
        '<Signature xmlns="%s" Id="%s">\n<SignedInfo>\n'
        '<CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></CanonicalizationMethod>\n'
        '<SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"></SignatureMethod>\n'
        "%s"
        '<Reference URI="#prop">\n<Transforms>\n'
        '<Transform Algorithm="http://www.w3.org/2006/12/xml-c14n11"></Transform>\n</Transforms>\n'
        '<DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></DigestMethod>\n'
        "<DigestValue>PROPDIGEST</DigestValue>\n</Reference>\n</SignedInfo>\n"
        "<SignatureValue>\nSIGVALUE\n</SignatureValue>\n"
        "<KeyInfo>\n<X509Data>\n%s</X509Data>\n</KeyInfo>\n%s\n</Signature>"
    ) % (DSIG, sig_id, "".join(refs),
         "".join("<X509Certificate>\n%s\n</X509Certificate>\n" % cert_b64(c) for c in certs), obj)

    # Digest of the <Object Id="prop"> element in canonical form. The Object text above is already
    # canonical (sorted attributes, explicit end tags, no whitespace); canonicalisation only adds the
    # inherited default namespace. This matches Tizen Studio's own output byte for byte.
    canonical_obj = obj.replace("<Object ", '<Object xmlns="%s" ' % DSIG, 1)
    prop_digest = base64.b64encode(hashlib.sha256(canonical_obj.encode()).digest()).decode()
    template = template.replace("PROPDIGEST", prop_digest)

    # Sign the exclusive-canonical SignedInfo.
    doc = etree.fromstring(template.encode())
    signed_info = doc.find("{%s}SignedInfo" % DSIG)
    c14n = etree.tostring(signed_info, method="c14n", exclusive=True)
    signature = key.sign(c14n, padding.PKCS1v15(), hashes.SHA256())
    return template.replace("SIGVALUE", b64(signature))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--author-key", required=True)
    ap.add_argument("--author-cert", required=True)
    ap.add_argument("--dev-ca", required=True)
    ap.add_argument("--dist-p12", required=True)
    ap.add_argument("--dist-pass", required=True)
    a = ap.parse_args()

    author_key = serialization.load_pem_private_key(open(a.author_key, "rb").read(), None)
    author_cert = x509.load_pem_x509_certificate(open(a.author_cert, "rb").read())
    raw = open(a.dev_ca, "rb").read()
    dev_ca = (x509.load_pem_x509_certificate(raw[raw.index(b"-----BEGIN"):])
              if b"-----BEGIN" in raw else x509.load_der_x509_certificate(raw))
    dkey, dcert, dchain = pkcs12.load_key_and_certificates(open(a.dist_p12, "rb").read(), a.dist_pass.encode())

    files = list_files(a.src)
    author_xml = build_signature(a.src, files, "AuthorSignature", "author", author_key, [author_cert, dev_ca])
    tmp_author = os.path.join(a.src, "author-signature.xml")
    with open(tmp_author, "w", newline="\n") as fh:
        fh.write(author_xml)
    dist_xml = build_signature(a.src, ["author-signature.xml"] + files, "DistributorSignature",
                               "distributor", dkey, [dcert] + list(dchain or []))

    with zipfile.ZipFile(a.out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("author-signature.xml", author_xml)
        for rel in files:
            z.write(os.path.join(a.src, rel), rel)
        z.writestr("signature1.xml", dist_xml)
    os.remove(tmp_author)
    print("Signed %d files -> %s" % (len(files), a.out))


if __name__ == "__main__":
    main()
