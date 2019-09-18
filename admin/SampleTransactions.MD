# Sample Transactions

## 1. Create TenderingOrganization

```JSON
{
  "$class": "com.marknjunge.tendering.participant.CreateTenderingOrganization",
  "participantId": "BungomaCounty",
  "name": "Bungoma County Municipal",
  "email": "bungoma@government.go.ke",
  "phone": "254712345678",
  "streetAddress": "Bungoma"
}
```

## 2. Create TenderNotice

```JSON
{
  "$class": "com.marknjunge.tendering.tender.CreateTenderNotice",
  "tenderId": "BGM/CNTY/PREQ/09/2019-2021",
  "organizationId": "BungomaCounty",
  "title": "SUPPLY AND DELIVERY OF PHARMACEUTICALS",
  "documentRef": "BGM-CNTY-PREQ-09-2019-2021.pdf",
  "documentHash": "347EB3CCDB13B83D75E87740AA90A3DE933E080A10E55565C125280E0BAD4B80",
  "submissionClosingDate": "2019-10-10T09:00:00.560Z",
  "openingVenue": "Former municipal county hall",
  "openingDate": "2019-10-10T09:00:00.560Z"
}
```

## 3. Create TenderBidder

```JSON
{
  "$class": "com.marknjunge.tendering.participant.CreateTenderBidder",
  "participantId": "Sentric#1237",
  "name": "Senric Ltd",
  "companyRegNo": "623496234",
  "email": "contact@sentric.com",
  "phone": "254712345678",
  "streetAddress": "Nairobi"
}
```

## 4. Create TenderBid

```JSON
{
  "$class": "com.marknjunge.tendering.tender.CreateTenderBid",
  "tenderNoticeId": "BGM/CNTY/PREQ/09/2019-2021",
  "bidderParticipantId": "Sentric#1237",
  "bidSummary": "Bid for tender BGM/CNTY/PREQ/09/2019-2021 valued at Ksh. 1,000,000",
  "documentRef": "Tender Bid.pdf",
  "documentHash": "688787d8ff144c502c7f5cffaafe2cc588d86079f9de88304c26b0cb99ce91c6"
}
```

## 5. Create Person

```JSON
{
  "$class": "com.marknjunge.tendering.participant.CreatePerson",
  "idNumber": "343",
  "name": "Mark",
  "mobileNumber": "254712345678"
}
```

## 6. Create TenderOpeningRegister

```JSON
{
  "$class": "com.marknjunge.tendering.tender.CreateTenderOpeningRegister",
  "tenderNoticeId": "BGM/CNTY/PREQ/09/2019-2021",
  "committeeMemberIds": ["343"]
}
```

## 7. Create TenderResult

```JSON
{
  "$class": "com.marknjunge.tendering.tender.CreateTenderResult",
  "tenderId": "BGM/CNTY/PREQ/09/2019-2021",
  "winningBidId": ""
}
```
