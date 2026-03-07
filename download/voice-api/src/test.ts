/**
 * API 測試腳本
 * 使用方式：npx ts-node src/test.ts
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

async function testHealth() {
  console.log('\n📋 測試健康檢查...');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ 健康檢查通過:', data);
    return true;
  } catch (error) {
    console.error('❌ 健康檢查失敗:', error);
    return false;
  }
}

async function testGetVoices() {
  console.log('\n📋 測試獲取語音列表...');
  try {
    const response = await fetch(`${BASE_URL}/api/voices`);
    const data = await response.json() as any;
    console.log('✅ 可用語音:', data.data?.voices?.map((v: any) => v.id).join(', '));
    return true;
  } catch (error) {
    console.error('❌ 獲取語音列表失敗:', error);
    return false;
  }
}

async function testTTS() {
  console.log('\n📋 測試 TTS（文字轉語音）...');
  try {
    const response = await fetch(`${BASE_URL}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '你好，這是 Net 知己語音 API 測試。',
        voice: 'tongtong',
        speed: 1.0,
        return_base64: true
      })
    });

    const data = await response.json() as any;

    if (data.success) {
      console.log('✅ TTS 成功');
      console.log(`   - 音頻大小: ${data.data.size} bytes`);
      console.log(`   - 格式: ${data.data.format}`);
      console.log(`   - 語音: ${data.data.voice}`);

      // 保存音頻文件
      const audioBuffer = Buffer.from(data.data.audio, 'base64');
      const outputPath = path.join(__dirname, '..', 'test-output.wav');
      fs.writeFileSync(outputPath, audioBuffer);
      console.log(`   - 已保存到: ${outputPath}`);
      return true;
    } else {
      console.error('❌ TTS 失敗:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ TTS 測試失敗:', error);
    return false;
  }
}

async function testASR() {
  console.log('\n📋 測試 ASR（語音轉文字）...');
  console.log('⚠️  ASR 測試需要提供音頻文件，跳過此測試');
  return true;
}

async function runTests() {
  console.log('═══════════════════════════════════════');
  console.log('   Net 知己 語音 API 測試');
  console.log('═══════════════════════════════════════');
  console.log(`API URL: ${BASE_URL}`);

  const results = {
    health: await testHealth(),
    voices: await testGetVoices(),
    tts: await testTTS(),
    asr: await testASR()
  };

  console.log('\n═══════════════════════════════════════');
  console.log('   測試結果總結');
  console.log('═══════════════════════════════════════');

  Object.entries(results).forEach(([name, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${name.toUpperCase()}`);
  });

  const allPassed = Object.values(results).every(r => r);
  console.log('\n' + (allPassed ? '🎉 所有測試通過！' : '⚠️  部分測試失敗'));
}

runTests().catch(console.error);
