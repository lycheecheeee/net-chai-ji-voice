#!/usr/bin/env python3
"""
24小時廣東話財經電台 - 自動生成節目
使用 BigModel API 生成腳本 + Cantonese API 語音合成
"""

import os
import json
import requests
import feedparser
from datetime import datetime
from pathlib import Path

# 配置
BIGMODEL_API_KEY = os.getenv('BIGMODEL_API_KEY')
CANTONESE_API_KEY = os.getenv('CANTONESE_API_KEY')

# 節目編排表
PROGRAM_SCHEDULE = {
    0: {'name': '深夜財經回顧', 'type': 'finance_night'},
    1: {'name': '凌晨音樂', 'type': 'overnight'},
    2: {'name': '深夜音樂廊', 'type': 'overnight'},
    3: {'name': '午夜輕音樂', 'type': 'overnight'},
    4: {'name': '凌晨音樂', 'type': 'overnight'},
    5: {'name': '清晨音樂', 'type': 'overnight'},
    6: {'name': '早晨新聞', 'type': 'general_news'},
    7: {'name': '晨早財經速報', 'type': 'finance_morning'},
    8: {'name': '上班路上', 'type': 'general_news'},
    9: {'name': '開市大直播', 'type': 'finance_opening'},
    10: {'name': '熱門話題', 'type': 'general_news'},
    11: {'name': '音樂早晨', 'type': 'weekend_music'},
    12: {'name': '午間新聞財經', 'type': 'finance_noon'},
    13: {'name': '午後音樂', 'type': 'weekend_music'},
    14: {'name': '下午茶時間', 'type': 'general_news'},
    15: {'name': '音樂下午茶', 'type': 'weekend_music'},
    16: {'name': '收市檢閱', 'type': 'finance_closing'},
    17: {'name': '放工前奏', 'type': 'weekend_music'},
    18: {'name': '晚間新聞', 'type': 'general_news'},
    19: {'name': '今日焦點', 'type': 'general_news'},
    20: {'name': '美股前哨', 'type': 'finance_us'},
    21: {'name': '夜音樂', 'type': 'weekend_music'},
    22: {'name': '環球財經夜', 'type': 'finance_night'},
    23: {'name': '夜傾情', 'type': 'general_news'},
}

def get_current_hour():
    """獲取當前小時"""
    return datetime.now().hour

def get_program_info(hour):
    """獲取節目信息"""
    return PROGRAM_SCHEDULE.get(hour, {'name': '音樂連播', 'type': 'weekend_music'})

def fetch_finance_data():
    """抓取財經數據"""
    data = {}
    try:
        # 恆生指數
        response = requests.get(
            'https://query1.finance.yahoo.com/v8/finance/chart/%5EHSI?interval=1d&range=1d',
            timeout=10
        )
        if response.ok:
            result = response.json().get('chart', {}).get('result', [{}])[0]
            meta = result.get('meta', {})
            data['hsi'] = meta.get('regularMarketPrice', 'N/A')
    except Exception as e:
        print(f"抓取恆指失敗: {e}")
        data['hsi'] = 'N/A'
    
    return data

def generate_script_bigmodel(program_type, program_name, hour, finance_data):
    """使用 BigModel API 生成粵語腳本"""
    
    prompts = {
        'finance_morning': f"""你係香港電台「{program_name}」主播。
時間：朝早{hour}點
數據：恆指{finance_data.get('hsi', '待公佈')}

請用廣東話口語報道（約150-200字）：
- 開場：「早晨！{program_name}，為你睇實市場」
- 恆生指數表現
- 外圍市場概況
- 結尾：「開市前最後消息，留意9點開市大直播」

只輸出純文字腳本。""",

        'finance_opening': f"""你係香港電台「{program_name}」主播。
時間：{hour}點，港股剛開市
數據：恆指{finance_data.get('hsi', '開市價')}

請用廣東話口語報道（約150-200字）：
- 開場：「開市大直播！港股正式開市」
- 即時恆指點位
- 重磅股表現
- 結尾：「即時市況，繼續為你跟進」

只輸出純文字腳本。""",

        'finance_noon': f"""你係香港電台「{program_name}」主播。
時間：中午{hour}點

請用廣東話口語報道（約150-200字）：
- 開場：「午間財經，上午市總結」
- 半日市表現
- 結尾：「下午市展望，留意16點收市檢閱」

只輸出純文字腳本。""",

        'finance_closing': f"""你係香港電台「{program_name}」主播。
時間：下午{hour}點，全日收市

請用廣東話口語報道（約150-200字）：
- 開場：「收市檢閱！港股全日收市」
- 恆指全日表現
- 結尾：「今日市況到此，明日再會」

只輸出純文字腳本。""",

        'finance_us': f"""你係香港電台「{program_name}」主播。
時間：晚上{hour}點，美股即將開市

請用廣東話口語報道（約150-200字）：
- 開場：「美股前哨，預備開市」
- 美股期貨走勢
- 結尾：「環球財經夜22點再同你跟進」

只輸出純文字腳本。""",

        'finance_night': f"""你係香港電台「{program_name}」主播。
時間：晚上{hour}點

請用廣東話口語報道（約150-200字）：
- 開場：「環球財經夜，美股表現」
- 美股走勢
- 結尾：「明晨財經速報7點再會」

只輸出純文字腳本。""",

        'general_news': f"""你係香港電台「{program_name}」主播。
時間：{hour}點

請用廣東話口語報道（約100-150字）：
- 開場：「各位聽眾朋友好，{hour}點整點新聞」
- 新聞重點
- 結尾：「多謝收聽」

只輸出純文字腳本。""",

        'weekend_music': f"""你係香港電台「{program_name}」DJ。
時間：{hour}點

請用廣東話口語（約50-80字）：
- 開場：「輕鬆一下，送上音樂」
- 結尾：「享受音樂，稍後再見」

只輸出純文字腳本。""",

        'overnight': f"""你係香港電台深夜節目DJ。
時間：凌晨{hour}點

請用廣東話輕聲（約30-50字）：
- 「而家係凌晨{hour}點，深夜音樂廊」
- 「祝你好夢」

只輸出純文字腳本。"""
    }
    
    prompt = prompts.get(program_type, prompts['general_news'])
    
    try:
        response = requests.post(
            'https://open.bigmodel.cn/api/paas/v4/chat/completions',
            headers={
                'Authorization': f'Bearer {BIGMODEL_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'glm-4',
                'messages': [
                    {'role': 'system', 'content': '你係專業粵語電台主播，只輸出純文字粵語腳本。'},
                    {'role': 'user', 'content': prompt}
                ],
                'temperature': 0.8,
                'max_tokens': 500
            },
            timeout=30
        )
        
        if response.ok:
            result = response.json()
            return result.get('choices', [{}])[0].get('message', {}).get('content', '')
        else:
            print(f"BigModel API 錯誤: {response.status_code}")
            return get_default_script(program_type, hour)
    except Exception as e:
        print(f"生成腳本失敗: {e}")
        return get_default_script(program_type, hour)

def get_default_script(program_type, hour):
    """獲取預設腳本"""
    defaults = {
        'finance_morning': '早晨！晨早財經速報，為你睇實市場。恆生指數最新走勢，外圍市場表現。',
        'finance_opening': '開市大直播！港股正式開市，即時市況為你跟進。',
        'finance_noon': '午間財經，上午市總結。恆指半日表現，下午市展望。',
        'finance_closing': '收市檢閱！港股全日收市。今日市況到此，明日再會。',
        'finance_us': '美股前哨，預備開市。美股期貨走勢，稍後詳細報道。',
        'finance_night': '環球財經夜，美股表現。明晨財經速報7點再會。',
        'general_news': f'各位聽眾朋友好，{hour}點整點新聞。多謝收聽。',
        'weekend_music': '輕鬆一下，送上音樂。享受美好時光，稍後再見。',
        'overnight': f'而家係凌晨{hour}點，深夜音樂廊。祝你好夢。'
    }
    return defaults.get(program_type, defaults['general_news'])

def synthesize_voice_cantonese(text, output_file):
    """使用 Cantonese API 合成語音"""

    # 清理文本
    clean_text = text.replace('\n', '，').strip()[:500]

    # Cantonese.ai 語音 ID
    VOICE_ID = '91b6d38b-d4e9-42ce-bf3c-9793741c0d18'

    try:
        response = requests.post(
            'https://cantonese.ai/api/tts',
            headers={
                'Content-Type': 'application/json'
            },
            json={
                'api_key': CANTONESE_API_KEY,
                'text': clean_text,
                'frame_rate': '24000',
                'speed': 1.0,
                'pitch': 0,
                'language': 'cantonese',
                'output_extension': 'wav',
                'voice_id': VOICE_ID,
                'should_return_timestamp': False
            },
            timeout=60
        )

        if response.ok:
            # Cantonese.ai 直接返回音頻數據
            with open(output_file, 'wb') as f:
                f.write(response.content)
            return True
        else:
            print(f"Cantonese API 錯誤: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"語音合成失敗: {e}")
        return False

def main():
    print("📻 24小時廣東話財經電台")
    print("=" * 50)
    
    # 獲取當前時間和節目信息
    hour = get_current_hour()
    program = get_program_info(hour)
    
    print(f"📅 時間: {hour}:00")
    print(f"📺 節目: {program['name']}")
    print(f"類型: {program['type']}")
    
    # 抓取財經數據
    finance_data = {}
    if 'finance' in program['type']:
        print("📊 抓取財經數據...")
        finance_data = fetch_finance_data()
        print(f"恆指: {finance_data.get('hsi', 'N/A')}")
    
    # 生成腳本
    print("📝 生成腳本...")
    script = generate_script_bigmodel(
        program['type'],
        program['name'],
        hour,
        finance_data
    )
    print(f"腳本長度: {len(script)} 字")
    print(f"內容預覽: {script[:100]}...")
    
    # 創建輸出目錄
    output_dir = Path('broadcasts')
    output_dir.mkdir(exist_ok=True)
    
    # 合成語音
    output_file = output_dir / f'broadcast_{hour:02d}.mp3'
    print(f"🎵 合成語音: {output_file}")
    
    if synthesize_voice_cantonese(script, output_file):
        print(f"✅ 音頻已生成: {output_file}")
        
        # 保存腳本
        script_file = output_dir / f'script_{hour:02d}.txt'
        with open(script_file, 'w', encoding='utf-8') as f:
            f.write(script)
        
        # 保存元數據
        metadata = {
            'hour': hour,
            'program_name': program['name'],
            'program_type': program['type'],
            'script': script,
            'finance_data': finance_data,
            'created_at': datetime.now().isoformat()
        }
        
        metadata_file = output_dir / f'metadata_{hour:02d}.json'
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        print("✅ 節目生成完成！")
    else:
        print("❌ 語音合成失敗")
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())
