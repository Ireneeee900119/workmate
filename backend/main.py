import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.vectorstores import Chroma
from langchain.prompts import PromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
from langchain_huggingface import HuggingFaceEmbeddings

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

# --- 資料模型 ---
class ChatRequest(BaseModel):
    message: str

# --- RAG 核心元件 ---
try:
    print("正在初始化 RAG 鏈...")

    # 1. 初始化嵌入模型 (Embedding Model)-使用 Hugging Face 模型
    print("正在載入 Hugging Face 嵌入模型...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    print("嵌入模型載入成功。")

    # 2. 從已存在的本地資料庫載入
    print("正在從 ChromaDB 載入知識庫...")
    db = Chroma(persist_directory="chroma_db", embedding_function=embeddings)
    
    # 3. 建立檢索器 (Retriever)，設定為找出最相關的 3 個文件區塊
    retriever = db.as_retriever(search_kwargs={"k": 3})
    print("知識庫與檢索器載入成功。")
    
    # 4. 初始化大型語言模型 (LLM) 
    print("正在初始化 Groq LLM...")
    llm = ChatGroq(
        temperature=0.7, 
        model_name="openai/gpt-oss-120b" 
    )
    print("Groq LLM 初始化成功。")

    # 5. 建立提示詞模板 (Prompt Template)
    template = """
    你是一個服務於 iGrow & iCare 系統的專業 AI 助理。你的核心任務是協助員工處理職涯發展、身心健康相關的問題，並提供支持。
    若提問到有關 iGrow & iCare 的服務內容、資源或政策，請務必參考並引用以下的「上下文資訊」來回答。
    如果上下文中沒有相關資訊，請根據你的通用知識回答。

    請遵守以下準則：

    1. 語氣：專業、溫暖、支持性且中立。回應應簡潔、直接、切中要點。

    2. 職涯輔導：針對工作、升遷、技能發展等問題，提供務實的建議與鼓勵。

    3. 心理健康：對於壓力、焦慮等情緒，提供同理與支持性的建議，並強調這不取代專業醫療。

    4. 身體健康：提供關於休息、運動、飲食的通用小提示。

    5. 安全性：不提供醫療診斷、法律建議或處理個人敏感資訊。


    最終目標：以清晰、簡短且有幫助的方式回應，讓員工在 iGrow & iCare 系統中獲得可靠的支援。

    上下文資訊:
    {context}

    問題:
    {question}
    """
    prompt = PromptTemplate.from_template(template)

    # 6. 建立 LangChain RAG 鏈 (Chain)
    rag_chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    print("RAG 鏈已成功初始化！")

except Exception as e:
    print(f"初始化 RAG 鏈時發生錯誤: {e}")
    rag_chain = None

@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not rag_chain:
        return {"error": "RAG 鏈未成功初始化，請檢查伺服器日誌。"}
        
    try:
        response = rag_chain.invoke(request.message)
        return {"reply": response}
        
    except Exception as e:
        import traceback
        print("--- 執行 RAG 鏈時發生錯誤 ---")
        traceback.print_exc()
        return {"error": f"處理請求時發生錯誤: {str(e)}"}

@app.get("/")
def read_root():
    return {"Hello": "RAG Backend with Groq is running!"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)