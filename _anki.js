function getColoredText(sentence) {
  let temp = document.createElement('div');
  temp.innerHTML = sentence;
  var coloredSpans = temp.querySelectorAll('span[style*="color"]');
  var coloredText = Array.from(coloredSpans).map(span => span.textContent);
  return coloredText[0] ?? '';
}

function replaceSpacesWithHyphens(text) {
  return text.replaceAll(" ", "-");
}

function getBaseForm(word) {
  var doc = nlp(word);
  doc.nouns().toSingular();
  doc.verbs().toInfinitive();
  return doc.text();
}

function formatString(str, length, suffix) {
  if (str.length >= length) {
    // 文字列が指定長以上の場合は切り詰める
    return str.slice(0, length);
  } else {
    // 文字列が指定長より短い場合
    let result = str.padEnd(length, '_');
    if (length >= 5 && result.endsWith('_')) {
      // 長さが5以上で、最後が'_'の場合はsuffixに置き換える
      result = result.slice(0, -1) + suffix;
    }
    return result;
  }
}

function convertSentenceToBaseForm(sentence) {
  var coloredText = getColoredText(sentence);
  return getBaseForm(coloredText);
}

function setOxfordDictionaryLink(id, sentence) {
  console.log(id);
  console.log(sentence);
  var text = convertSentenceToBaseForm(sentence);
  document.getElementById(id).innerHTML = "Oxford: " + text;
  document.getElementById(id).href = 'https://www.oxfordlearnersdictionaries.com/definition/english/' + text;
}

function playAudioUK(sentence) {
  var coloredText = getColoredText(sentence);
  var text = replaceSpacesWithHyphens(coloredText).toLowerCase();
  text = getBaseForm(text);
  var p1 = formatString(text, 1, 'g');
  var p2 = formatString(text, 3, 'g');
  var p3 = formatString(text, 5, 'g');
  var audio = new Audio();
  audio.src = `https://www.oxfordlearnersdictionaries.com/media/english/uk_pron/${p1}/${p2}/${p3}/${text}__gb_1.mp3`;
  audio.play();
}

function playAudioUS(sentence) {
  var text = convertSentenceToBaseForm(sentence);
  var p1 = formatString(text, 1, 'u');
  var p2 = formatString(text, 3, 'u');
  var p3 = formatString(text, 5, 'u');
  var audio = new Audio();
  audio.src = `https://www.oxfordlearnersdictionaries.com/media/english/us_pron/${p1}/${p2}/${p3}/${text}__us_1.mp3`;
  audio.play();
}

function buildQuestionForMakingExampleSentence(
  sentence,
  inputTextAreaId
) {
  var text = convertSentenceToBaseForm(sentence);
  var createdSentence = document.getElementById(inputTextAreaId).value;
  return question = `
#命令書:
あなたはアメリカ人のプロの英語講師です
以下の制約条件と入力文をもとに最高の添削を出力してください
生徒は${text}を使った例文を作成することができるようになりたいと思っています

#制約条件:
・日本語で説明すること
・文字数は200文字程度
・文章を簡潔に
・文法間違い、より適切な表現があれば訂正する
・訂正した理由を述べる
・${text}を使用した例文を1つ提示する

#入力分:
${createdSentence}
`;
}

function askChatGPTForMakingExampleSentence(
  sentence,
  secretKey,
  inputTextAreaId,
  outputTextAreaId
) {
  var question = buildQuestionForMakingExampleSentence(sentence, inputTextAreaId);

  document.getElementById(outputTextAreaId).value = "ChatGPTに質問中...";
  askChatGPT(question, secretKey, outputTextAreaId);
}

function askGeminiForMakingExampleSentence(
  sentence,
  secretKey,
  inputTextAreaId,
  outputTextAreaId
) {
  var question = buildQuestionForMakingExampleSentence(sentence, inputTextAreaId);

  document.getElementById(outputTextAreaId).value = "Geminiに質問中...";
  askGemini(question, secretKey, outputTextAreaId);
}

function askChatGPT(
  question,
  secretKey,
  outputTextAreaId
) {
  async function getResponse() {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          "model": "gpt-4o-mini",
          "messages": [
            { "role": "user", "content": question }
          ]
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secretKey}`,
          },
        }
      );
      var content = response.data.choices[0].message.content;
      document.getElementById(outputTextAreaId).value = content;
    } catch (error) {
      console.log(error);
      document.getElementById(outputTextAreaId).value = error;
      throw error;
    }
  }
  getResponse();
}

function askGemini(
  question,
  secretKey,
  outputTextAreaId
) {
  async function getResponse() {
    try {
      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + secretKey,
        {
          "model": "gpt-4o-mini",
          "contents": [
            { "parts": [{ "text": question }] }
          ]
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      var content = response.data.candidates[0].content.parts[0].text;
      document.getElementById(outputTextAreaId).value = content;
    } catch (error) {
      console.log(error);
      document.getElementById(outputTextAreaId).value = error;
      throw error;
    }
  }
  getResponse();
}

function createAIField(
  sentence,
  chatGPTSecretKey,
  geminiSecretKey
) {
  // <div id="groupedElements"></div>
  const container = document.createElement('div');
  container.id = 'groupedElements';

  // <textarea id="example_sentence" cols="80" rows="1"></textarea>
  const exampleTextarea = document.createElement('textarea');
  exampleTextarea.id = 'example_sentence';
  exampleTextarea.cols = 80;
  exampleTextarea.rows = 2;

  // <br> (改行)
  const br1 = document.createElement('br');

  // <button onclick="chatGPT()">ChatGPTに聞く</button>
  const chatGPTButton = document.createElement('button');
  chatGPTButton.textContent = 'ChatGPTに聞く';
  chatGPTButton.onclick = () => askChatGPTForMakingExampleSentence(sentence, chatGPTSecretKey, 'example_sentence', 'response');

  // <button onclick="gemini()">Geminiに聞く</button>
  const geminiButton = document.createElement('button');
  geminiButton.textContent = 'Geminiに聞く';
  geminiButton.onclick = () => askGeminiForMakingExampleSentence(sentence, geminiSecretKey, 'example_sentence', 'response');

  // <br> (改行)
  const br2 = document.createElement('br');

  // <textarea id="response" cols="80" rows="18" disabled></textarea>
  const responseTextarea = document.createElement('textarea');
  responseTextarea.id = 'response';
  responseTextarea.cols = 80;
  responseTextarea.rows = 18;
  responseTextarea.disabled = true;

  // 作成した要素をcontainerに追加
  container.appendChild(exampleTextarea);
  container.appendChild(br1);
  container.appendChild(chatGPTButton);
  container.appendChild(geminiButton);
  container.appendChild(br2);
  container.appendChild(responseTextarea);

  // コンテナをbodyに追加
  document.body.appendChild(container);
}

// 一括削除する関数
function removeGroupedElements() {
  const containerToRemove = document.getElementById('groupedElements');
  if (containerToRemove) {
    containerToRemove.remove(); // コンテナごと削除
  }
}

function embedYouTube(url, startOffset, endOffset) {
  const videoId = url.split('youtu.be/')[1].split('?')[0];
  const timestamp = url.split('t=')[1] || 0;
  const start = Math.max(0, parseInt(timestamp) - startOffset);
  const end = parseInt(timestamp) + endOffset;

  document.getElementById('youtube-player')?.remove();

  const iframe = document.createElement('iframe');
  iframe.id = "youtube-player";
  iframe.width = "640";
  iframe.height = "360";
  iframe.src = `https://www.youtube.com/embed/${videoId}?start=${start}&end=${end}&cc_load_policty=1&autoplay=0&modestbranding=1&fs=0&iv_load_policy=3&cc_lang_pref=en&rel=0`;
  iframe.allowFullscreen = true;

  document.body.appendChild(iframe);
}

removeGroupedElements();
