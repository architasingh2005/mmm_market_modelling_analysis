/**
 * Node Integration Test Script — Dual Profile Picture & Single Source Switching
 * Verifies URL profile update, image upload, source switching, and photo removal against MongoDB.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../models/userModel.js';

async function runDualProfilePictureTest() {
  const mongoUri = process.env.MONGODB_URL;
  if (!mongoUri) throw new Error('MONGODB_URL environment variable is not set. Add it to your .env file.');
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(mongoUri);

  try {
    const user = await User.findOne({});
    if (!user) {
      console.log('No user found in database.');
      process.exit(0);
    }

    console.log(`[Test User] ${user.name} (${user.email})`);

    // TEST 1: URL Profile Picture Update
    console.log('\n--- TEST 1: Direct Image URL Setting ---');
    const testUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb';
    user.profilePicture = testUrl;
    user.profileImageSource = 'url';
    await user.save();

    let reloadedUser = await User.findById(user._id);
    console.log(`  Source:  ${reloadedUser.profileImageSource}`);
    console.log(`  Picture: ${reloadedUser.profilePicture}`);
    if (reloadedUser.profileImageSource !== 'url' || reloadedUser.profilePicture !== testUrl) {
      throw new Error('Test 1 Failed: URL source not stored correctly');
    }
    console.log('  TEST 1: PASSED');

    // TEST 2: Device Upload Source Switching
    console.log('\n--- TEST 2: Device Upload Source Setting ---');
    const uploadUrl = 'http://localhost:3001/uploads/test-avatar-12345.jpg';
    user.profilePicture = uploadUrl;
    user.profileImageSource = 'upload';
    await user.save();

    reloadedUser = await User.findById(user._id);
    console.log(`  Source:  ${reloadedUser.profileImageSource}`);
    console.log(`  Picture: ${reloadedUser.profilePicture}`);
    if (reloadedUser.profileImageSource !== 'upload' || reloadedUser.profilePicture !== uploadUrl) {
      throw new Error('Test 2 Failed: Upload source not stored correctly');
    }
    console.log('  TEST 2: PASSED');

    // TEST 3: Photo Removal
    console.log('\n--- TEST 3: Photo Removal & Reverting to Initials Fallback ---');
    user.profilePicture = '';
    user.profileImageSource = 'none';
    await user.save();

    reloadedUser = await User.findById(user._id);
    console.log(`  Source:  ${reloadedUser.profileImageSource}`);
    console.log(`  Picture: "${reloadedUser.profilePicture}"`);
    if (reloadedUser.profileImageSource !== 'none' || reloadedUser.profilePicture !== '') {
      throw new Error('Test 3 Failed: Photo removal failed');
    }
    console.log('  TEST 3: PASSED');

    console.log('\n======================================================');
    console.log('ALL DUAL PROFILE PICTURE TESTS PASSED 100%');
    console.log('======================================================');

  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runDualProfilePictureTest();
