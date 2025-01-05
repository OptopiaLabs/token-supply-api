const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');
const moment = require('moment');

const app = express();
const port = 3000;

// CSV column name mappings
const COLUMNS = {
  DATE: 'Date',
  MONTH: 'Month',
  BOOSTER: 'Booster Event',
  LIQUIDITY: 'Initial Liquidity & MM Fund',
  PRIVATE_SALE: 'Private Sale',
  PUBLIC_SALE: 'Public Sale',
  KOL: 'KOL Round',
  MARKETING: 'Marketing',
  ECOSYSTEM: 'Ecosystem Fund',
  COMMUNITY: 'Community',
  TOTAL: 'Total',
};

let tokenomicsData = [];

fs.createReadStream('tokenomics.csv')
  .pipe(csv())
  .on('data', (row) => {
    // Process number formats
    const processedRow = {};
    Object.entries(row).forEach(([key, value]) => {
      if (key === COLUMNS.DATE || key === COLUMNS.MONTH) {
        processedRow[key] = value;
      } else {
        processedRow[key] = Number(value.replace(/,/g, ''));
      }
    });
    tokenomicsData.push(processedRow);
  });

function formatTimeRange(timestamp, type, tokenomicsData) {
  const currentDate = moment(timestamp).format('YYYY/MM/DD');
  const firstDate = moment(
    tokenomicsData[0][COLUMNS.DATE],
    'YYYY/MM/DD'
  ).format('YYYY/MM/DD');
  const lastDate = moment(
    tokenomicsData[tokenomicsData.length - 1][COLUMNS.DATE],
    'YYYY/MM/DD'
  ).format('YYYY/MM/DD');

  switch (type) {
    case 'before_first':
      return `Before ${firstDate} (Current: ${currentDate})`;
    case 'after_last':
      return `After ${lastDate} (Current: ${currentDate})`;
    case 'between':
      let prevDate, nextDate;
      for (let i = 0; i < tokenomicsData.length - 1; i++) {
        const date1 = moment(
          tokenomicsData[i][COLUMNS.DATE],
          'YYYY/MM/DD'
        ).format('YYYY/MM/DD');
        const date2 = moment(
          tokenomicsData[i + 1][COLUMNS.DATE],
          'YYYY/MM/DD'
        ).format('YYYY/MM/DD');
        if (currentDate >= date1 && currentDate < date2) {
          prevDate = date1;
          nextDate = date2;
          break;
        }
      }
      return `${prevDate} - ${nextDate} (Current: ${currentDate})`;
  }
}

function formatSupplyResponse(timestamp, data, timeRangeType, tokenomicsData) {
  return {
    timestamp,
    timeRange: formatTimeRange(timestamp, timeRangeType, tokenomicsData),
    maxSupply: tokenomicsData[tokenomicsData.length - 1][COLUMNS.TOTAL],
    circulatingSupply: data[COLUMNS.TOTAL],
    circulatingPercent:
      data[COLUMNS.TOTAL] /
      tokenomicsData[tokenomicsData.length - 1][COLUMNS.TOTAL],
    categorySupply: {
      boosterEvent: data[COLUMNS.BOOSTER],
      liquidityAndMMFund: data[COLUMNS.LIQUIDITY],
      privateSale: data[COLUMNS.PRIVATE_SALE],
      publicSale: data[COLUMNS.PUBLIC_SALE],
      kolRound: data[COLUMNS.KOL],
      marketing: data[COLUMNS.MARKETING],
      ecosystemFund: data[COLUMNS.ECOSYSTEM],
      community: data[COLUMNS.COMMUNITY],
    },
    csv: 'https://github.com/OptopiaLabs/token-supply-api/blob/main/tokenomics.csv',
  };
}

function calculateSupply(timestamp) {
  const currentDate = moment(timestamp);
  if (!currentDate.isValid()) {
    throw new Error('Invalid timestamp format. Please use ISO 8601 format.');
  }

  // If timestamp is earlier than the first record
  const firstDate = moment(tokenomicsData[0][COLUMNS.DATE], 'YYYY/MM/DD');
  if (currentDate.isBefore(firstDate)) {
    return formatSupplyResponse(
      timestamp,
      {
        [COLUMNS.TOTAL]: 0,
        [COLUMNS.BOOSTER]: 0,
        [COLUMNS.LIQUIDITY]: 0,
        [COLUMNS.PRIVATE_SALE]: 0,
        [COLUMNS.PUBLIC_SALE]: 0,
        [COLUMNS.KOL]: 0,
        [COLUMNS.MARKETING]: 0,
        [COLUMNS.ECOSYSTEM]: 0,
        [COLUMNS.COMMUNITY]: 0,
      },
      'before_first',
      tokenomicsData
    );
  }

  // If timestamp is after or equal to the last record
  const lastDate = moment(
    tokenomicsData[tokenomicsData.length - 1][COLUMNS.DATE],
    'YYYY/MM/DD'
  );
  if (currentDate.isSameOrAfter(lastDate)) {
    return formatSupplyResponse(
      timestamp,
      tokenomicsData[tokenomicsData.length - 1],
      'after_last',
      tokenomicsData
    );
  }

  // Find the relevant date range
  const relevantData = tokenomicsData.find((row, index) => {
    const currentRowDate = moment(row[COLUMNS.DATE], 'YYYY/MM/DD');
    const nextRowDate =
      index < tokenomicsData.length - 1
        ? moment(tokenomicsData[index + 1][COLUMNS.DATE], 'YYYY/MM/DD')
        : null;

    return (
      currentDate.isSameOrAfter(currentRowDate) &&
      (nextRowDate === null || currentDate.isBefore(nextRowDate))
    );
  });

  return formatSupplyResponse(
    timestamp,
    relevantData,
    'between',
    tokenomicsData
  );
}

app.use((req, res, next) => {
  const { timestamp } = req.query;
  if (timestamp) {
    const date = moment(timestamp);
    if (!date.isValid()) {
      return res.status(400).json({
        error: 'Invalid timestamp value',
      });
    }
  }
  next();
});

app.get('*', (req, res) => {
  const timestamp = req.query.timestamp || new Date().getTime();
  const supply = calculateSupply(timestamp);
  res.json(supply);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
