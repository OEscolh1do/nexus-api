try {
  console.log('Loading express...');
  require('express');
  console.log('Express loaded.');

  console.log('Loading express-async-errors...');
  require('express-async-errors');
  console.log('Express-async-errors loaded.');
} catch (e) {
  console.error('ERROR:', e.message);
  console.error('CODE:', e.code);
  console.error('STACK:', e.stack);
}
