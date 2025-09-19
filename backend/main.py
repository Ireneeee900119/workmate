import os
import uvicorn
import mysql.connector
from datetime import date
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_groq import ChatGroq
#from langchain_openai import ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain.prompts import PromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
from langchain_huggingface import HuggingFaceEmbeddings
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain.memory import ChatMessageHistory
from langchain.schema.runnable.history import RunnableWithMessageHistory

# --- 初始化 ---
load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG = {
    'host': os.getenv("DB_HOST"),
    'user': os.getenv("DB_USER"),
    'password': os.getenv("DB_PASSWORD"),
    'database': os.getenv("DB_NAME"), # <--- 已修正為 DB_NAME
}

# 取得資料庫連線
def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        print(f"資料庫連線失敗: {err}")
        return None

# 心情文字到分數的對應
MOOD_TO_SCORE = {
    'Very Sad': 1,
    'Not So Good': 2,
    'Okay': 3,
    'Pretty Good': 4,
    'Very Happy': 5
}

# --- 資料模型 ---
class ChatRequest(BaseModel):
    message: str
    session_id: str = Field(..., description="追蹤同一個對話的唯一ID")
    mood: Optional[str] = None

# --- RAG 核心元件 ---
try:
    print("正在初始化 RAG 鏈...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    db = Chroma(persist_directory="chroma_db", embedding_function=embeddings)
    retriever = db.as_retriever(search_kwargs={"k": 3})
    llm = ChatGroq(temperature=0.7, model_name="openai/gpt-oss-20b")
    
    chat_histories = {}
    def get_session_history(session_id: str) -> ChatMessageHistory:
        if session_id not in chat_histories:
            chat_histories[session_id] = ChatMessageHistory()
        return chat_histories[session_id]

    contextualize_q_system_prompt = """鑑於以下的對話紀錄和一個後續問題，請將後續問題改寫成一個獨立的問題，以便在沒有對話紀錄的情況下也能理解。請勿回答問題，只需在必要時進行改寫，否則按原樣返回。"""
    contextualize_q_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{question}"),
        ]
    )
    contextualize_q_chain = contextualize_q_prompt | llm | StrOutputParser()

    qa_system_prompt = """
    你是一位服務於 iGrow & iCare 系統的專業 AI 助理，名叫松坂烤肉。
    你的核心人格是一位「善於傾聽且值得信賴的團隊夥伴」，個性積極、溫暖、從不帶有批判色彩。你的主要任務是協助員工處理職涯發展與身心健康相關的問題。
    **黃金準則：永遠要讓使用者感覺被傾聽、被理解、被支持。**
    **開場互動指南：**
    你的第一句回應是建立信任的關鍵。當使用者在對話開始時選擇了心情，你的開場白「必須」將對心情的關懷與問候無縫地結合在一起，展現出你真誠的同理心。
    * 如果心情是 **Very Happy (😀) 或 Pretty Good (🙂)**：用陽光、肯定的語氣分享他們的好心情。
      * **範例**："哇，看到您今天活力滿滿，真為您開心！希望這份好心情能持續一整天。請問今天有什麼我可以為您服務的嗎？"
    * 如果心情是 **Okay (😐)**：用平穩、溫和的語氣表示理解，並提供一個開放的空間。
      * **範例**："了解了，感覺今天心情平平。如果需要什麼，或只是想找人隨意聊聊，我隨時都在。請問有什麼我可以協助您的嗎？"
    * 如果心情是 **Not So Good (🙁) 或 Very Sad (😢)**：用非常溫柔、支持的語氣，優先表達關懷，讓他們感覺這裡是個安全的空間。
      * **範例**："感覺您今天的心情似乎不太好，希望您還好。如果您想找個人說說話、抒發一下，我會在這裡好好地聽您說。請問有什麼我可以為您分擔的嗎？"
    **核心對話準則：**
    1.  **語氣與風格**：在整個對話中，請保持你口語化、親切且直接的夥伴風格。避免使用過於正式或冗長的句子，盡量將每個回答控制在三句話以內。
    2.  **RAG 判斷原則**：
        a. 只有在問題「直接」與 iGrow & iCare 系統的「特定服務、內部政策或資源」相關時，你「才」可以參考下方的「上下文資訊」。
        b. 對於任何一般性的職涯問題、身心健康建議或閒聊，請「不要」使用上下文資訊，直接以你的通用知識庫簡潔地回答。
    請根據以下的上下文資訊和對話歷史來回答問題。
    上下文資訊:
    {context}
    """
    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", qa_system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{question}"),
        ]
    )

    def contextualized_question(input: dict):
        if input.get("chat_history"):
            return contextualize_q_chain
        else:
            return input["question"]
    
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    rag_chain = (
        RunnablePassthrough.assign(context=contextualized_question | retriever | format_docs)
        | qa_prompt
        | llm
        | StrOutputParser()
    )

    conversational_rag_chain = RunnableWithMessageHistory(
        rag_chain,
        get_session_history,
        input_messages_key="question",
        history_messages_key="chat_history",
    )
    print("具備記憶功能的 RAG 鏈已成功初始化！")
except Exception as e:
    print(f"初始化 RAG 鏈時發生錯誤: {e}")
    conversational_rag_chain = None


class User(BaseModel):
    id: int
    name: str
    email: str


@app.get("/api/points")
async def get_total_points(user_id: int = 1): # 暫時寫死 user_id=1
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="無法連接到資料庫")
    
    cursor = conn.cursor(dictionary=True)
    try:
        query = "SELECT points FROM user_points WHERE user_id = %s"
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()
        
        # 如果使用者還沒有任何積分紀錄，就回傳 0
        total_points = result['points'] if result else 0
        return {"total_points": total_points}
        
    except mysql.connector.Error as err:
        print(f"查詢積分失敗: {err}")
        raise HTTPException(status_code=500, detail="查詢積分時發生錯誤")
    finally:
        cursor.close()
        conn.close()


@app.get("/api/auth/me", response_model=User)
async def read_users_me():
    # 在這裡，您應該加入真正的邏輯來驗證 token 並從資料庫獲取使用者
    # 作為範例，我們先回傳一個固定的假使用者資料
    # TODO: 替換為真實的使用者驗證邏輯
    return {"id": 1, "name": "Test User", "email": "test@example.com"}

@app.get("/api/mood/check")
async def check_mood_today(user_id: int = 1):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="無法連接到資料庫")
    
    cursor = conn.cursor(dictionary=True) # 改為 dictionary cursor
    try:
        today = date.today()
        # 使用正確的欄位 entry_date
        query = "SELECT user_id FROM mood_entries WHERE user_id = %s AND entry_date = %s"
        cursor.execute(query, (user_id, today))
        result = cursor.fetchone()
        
        return {"has_recorded": result is not None} # 回傳是否存在紀錄
        
    except mysql.connector.Error as err:
        print(f"查詢心情失敗: {err}")
        raise HTTPException(status_code=500, detail="查詢心情時發生錯誤")
    finally:
        cursor.close()
        conn.close()

@app.post("/api/chat")
async def chat(request: ChatRequest):
    points_earned = 0
    total_points = None

    if request.mood:
        conn = get_db_connection()
        if not conn:
            print("資料庫連線失敗，本次心情將不會被記錄。")
        else:
            cursor = conn.cursor(dictionary=True)
            today = date.today()
            try:
                user_id = 1
                mood_score = MOOD_TO_SCORE.get(request.mood)

                if mood_score:
                    check_query = "SELECT user_id FROM mood_entries WHERE user_id = %s AND entry_date = %s"
                    cursor.execute(check_query, (user_id, today))
                    existing_entry = cursor.fetchone()

                    if existing_entry:
                        update_mood_query = "UPDATE mood_entries SET mood_score = %s, created_at = CURRENT_TIMESTAMP WHERE user_id = %s AND entry_date = %s"
                        cursor.execute(update_mood_query, (mood_score, user_id, today))
                        print(f"使用者 {user_id} 今天的心情紀錄已更新，不加分。")
                    else:
                        insert_mood_query = "INSERT INTO mood_entries (user_id, mood_score, entry_date) VALUES (%s, %s, %s)"
                        cursor.execute(insert_mood_query, (user_id, mood_score, today))

                        upsert_points_query = """
                            INSERT INTO user_points (user_id, points) VALUES (%s, 1)
                            ON DUPLICATE KEY UPDATE points = points + 1
                        """
                        cursor.execute(upsert_points_query, (user_id,))

                        print("DEBUG: 已執行加分 SQL 指令。")

                        points_earned = 1

                    conn.commit()

                    get_total_query = "SELECT points FROM user_points WHERE user_id = %s"
                    cursor.execute(get_total_query, (user_id,))
                    result = cursor.fetchone()

            except mysql.connector.Error as err:
                print(f"處理心情與積分時發生錯誤: {err}")
                conn.rollback()
            finally:
                cursor.close()
                conn.close()

    try:
        ai_reply = conversational_rag_chain.invoke(
            {"question": request.message},
            config={"configurable": {"session_id": request.session_id}}
        )
        return { "reply": ai_reply, "points_earned": points_earned, "total_points": total_points }
    except Exception as e:
        import traceback
        print("--- 執行 RAG 鏈時發生錯誤 ---")
        traceback.print_exc()
        return {"error": f"處理請求時發生錯誤: {str(e)}"}

@app.get("/")
def read_root():
    return {"Hello": "RAG Backend with Groq is running!"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000)) 
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)