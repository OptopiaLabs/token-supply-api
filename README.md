# Tokenomics Supply API

A Node.js based REST API service for querying token supply data. The service reads tokenomics data in CSV format and provides an interface to query token supply by category based on timestamps.

## Features

- Parse and read tokenomics CSV data
- Query supply by timestamp
- Return total supply and detailed category breakdowns
- RESTful API design

## Installation

Requires Node.js (v14+). To install:

```bash
# Clone repository
git clone [repository-url]

# Install dependencies
cd [project-directory]
npm install
```

````

## Configuration

### CSV Data Format Requirements

The

tokenomics.csv

file should contain these columns:

- Date: Release date (YYYY/MM/DD)
- Month: Month number
- Booster Event: Booster allocation
- Initial Liquidity & MM Fund: Initial liquidity
- Private Sale: Private sale allocation
- Public Sale: Public sale allocation
- KOL Round: KOL round allocation
- Marketing: Marketing allocation
- Ecosystem Fund: Ecosystem fund allocation
- Community: Community allocation
- Total: Total supply

## Usage

```bash
# Start server
npm start
```

Server will run at http://localhost:3000

### API Endpoints

#### GET \*

Query token supply data for a specific timestamp.

**Parameters:**

- timestamp (optional): ISO format timestamp, defaults to current time

**Example Requests:**

```bash
# Query current supply
curl http://localhost:3000/

# Query supply for specific time
curl http://localhost:3000/?timestamp=2024-08-23T00:00:00Z
```

**Response Format:**

```json
{
  "timestamp": "2024-08-23T00:00:00Z",
  "totalSupply": 1772916667,
  "categorySupply": {
    "boosterEvent": 1000000000,
    "liquidityAndMMFund": 300000000,
    "privateSale": 29166666.67,
    "publicSale": 225000000,
    "kolRound": 31250000,
    "marketing": 41666666.67,
    "ecosystemFund": 104166666.67,
    "community": 41666666.67
  }
}
```

## Dependencies

- express: Web framework
- csv-parser: CSV parsing library
- moment: Date handling library

## License

MIT
````
