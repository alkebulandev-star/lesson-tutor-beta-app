# ════════════════════════════════════════════════════════════════
# AFRO-TTS — Nigerian English Voice Generator
# Copy this entire script into a Google Colab notebook
# Run each section as a separate cell
# ════════════════════════════════════════════════════════════════

# ═══ CELL 1: Install dependencies ═══
# !pip install TTS scipy huggingface_hub

# ═══ CELL 2: Download Afro-TTS model ═══
# from huggingface_hub import snapshot_download
# snapshot_download(repo_id="intronhealth/afro-tts", local_dir="afro-tts")
# print("Model downloaded!")

# ═══ CELL 3: Upload your voice sample ═══
# from google.colab import files
# uploaded = files.upload()  # Upload voice-sample.wav here
# print("Voice sample uploaded!")

# ═══ CELL 4: Load the model ═══
# from TTS.tts.configs.xtts_config import XttsConfig
# from TTS.tts.models.xtts import Xtts
# import torch
#
# config = XttsConfig()
# config.load_json("afro-tts/config.json")
# model = Xtts.init_from_config(config)
# model.load_checkpoint(config, checkpoint_dir="afro-tts/", eval=True)
# model.cuda()
# print("Model loaded and ready!")

# ═══ CELL 5: Generate audio from text ═══
# from scipy.io.wavfile import write
#
# # PASTE YOUR LESSON TEXT HERE
# lesson_text = """
# A noun is a naming word. It is the name of a person, place, animal, or thing.
# Examples of nouns include Chidi, Lagos, dog, and table.
# There are different types of nouns.
# Common nouns are general names like boy, girl, city.
# Proper nouns are specific names like Nigeria, Abuja, Mr Okon.
# They always start with a capital letter.
# Collective nouns name a group, like a flock of birds or a bunch of keys.
# Abstract nouns name things you cannot touch, like love, happiness, and courage.
# """
#
# # Split into chunks (model works best with shorter text)
# import re
# sentences = re.split(r'(?<=[.!?])\s+', lesson_text.strip())
# chunks = []
# current = ""
# for s in sentences:
#     if len(current) + len(s) < 200:
#         current += " " + s
#     else:
#         if current.strip():
#             chunks.append(current.strip())
#         current = s
# if current.strip():
#     chunks.append(current.strip())
#
# # Generate audio for each chunk and combine
# import numpy as np
# all_audio = []
# for i, chunk in enumerate(chunks):
#     print(f"Generating chunk {i+1}/{len(chunks)}: {chunk[:50]}...")
#     outputs = model.synthesize(
#         chunk,
#         config,
#         speaker_wav="voice-sample.wav",
#         gpt_cond_len=3,
#         language="en",
#     )
#     all_audio.append(outputs['wav'])
#     # Add small pause between chunks
#     all_audio.append(np.zeros(int(24000 * 0.5)))  # 0.5 sec pause
#
# # Combine all audio
# final_audio = np.concatenate(all_audio)
# write("lesson-audio.wav", 24000, final_audio)
# print(f"Done! Audio saved as lesson-audio.wav ({len(final_audio)/24000:.1f} seconds)")

# ═══ CELL 6: Download the audio file ═══
# files.download("lesson-audio.wav")

# ═══ CELL 7 (OPTIONAL): Batch generate multiple lessons ═══
# import json
#
# # Upload a JSON file with multiple lessons:
# # [{"id": "eng-p4-nouns", "text": "A noun is..."}, {"id": "mth-p4-addition", "text": "Addition is..."}]
#
# # uploaded = files.upload()  # Upload lessons.json
# # with open("lessons.json") as f:
# #     lessons = json.load(f)
# #
# # for lesson in lessons:
# #     print(f"\nGenerating: {lesson['id']}")
# #     sentences = re.split(r'(?<=[.!?])\s+', lesson['text'].strip())
# #     chunks = []
# #     current = ""
# #     for s in sentences:
# #         if len(current) + len(s) < 200:
# #             current += " " + s
# #         else:
# #             if current.strip(): chunks.append(current.strip())
# #             current = s
# #     if current.strip(): chunks.append(current.strip())
# #
# #     all_audio = []
# #     for chunk in chunks:
# #         outputs = model.synthesize(chunk, config, speaker_wav="voice-sample.wav", gpt_cond_len=3, language="en")
# #         all_audio.append(outputs['wav'])
# #         all_audio.append(np.zeros(int(24000 * 0.5)))
# #
# #     final = np.concatenate(all_audio)
# #     write(f"{lesson['id']}.wav", 24000, final)
# #     print(f"  Saved {lesson['id']}.wav ({len(final)/24000:.1f}s)")
# #
# # # Download all as zip
# # import zipfile, glob
# # with zipfile.ZipFile("lesson-audios.zip", "w") as z:
# #     for f in glob.glob("*.wav"):
# #         if f != "voice-sample.wav":
# #             z.write(f)
# # files.download("lesson-audios.zip")
