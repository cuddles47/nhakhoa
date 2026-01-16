#!/usr/bin/env node

/**
 * Password Hash Generator for Database Initialization
 * 
 * Usage:
 *   node generate_password_hash.js <password>
 *   
 * Example:
 *   node generate_password_hash.js admin123
 */

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

async function generateHash() {
  const password = process.argv[2];
  
  if (!password) {
    console.error('Error: Please provide a password as argument');
    console.error('Usage: node generate_password_hash.js <password>');
    process.exit(1);
  }
  
  if (password.length < 8) {
    console.warn('Warning: Password is less than 8 characters. Consider using a stronger password.');
  }
  
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    
    console.log('\n================================');
    console.log('Password Hash Generated');
    console.log('================================');
    console.log(`\nOriginal Password: ${password}`);
    console.log(`\nBcrypt Hash (${SALT_ROUNDS} rounds):`);
    console.log(hash);
    console.log('\nCopy this hash to your 005_seed_data.sql file');
    console.log('Replace: $2b$10$YourHashedPasswordHere');
    console.log(`With: ${hash}`);
    console.log('================================\n');
    
  } catch (error) {
    console.error('Error generating hash:', error.message);
    process.exit(1);
  }
}

generateHash();
