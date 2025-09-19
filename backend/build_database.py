import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

load_dotenv()

DATA_PATH = "data"
DB_PATH = "chroma_db"

def build_database():
    """
    此函數負責建立向量知識庫。
    """
    print("開始建立向量資料庫...")
    
    documents = []
    for filename in os.listdir(DATA_PATH):
        filepath = os.path.join(DATA_PATH, filename)
        if filename.endswith('.pdf'):
            loader = PyPDFLoader(filepath)
            documents.extend(loader.load())
        elif filename.endswith('.txt'):
            loader = TextLoader(filepath, encoding='utf-8')
            documents.extend(loader.load())
        if documents:
             print(f"已成功載入文件: {filename}")

    if not documents:
        print(f"在 '{DATA_PATH}' 資料夾中找不到任何可讀取的文件。")
        return

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=60)
    chunked_documents = text_splitter.split_documents(documents)
    print(f"文件已成功切分為 {len(chunked_documents)} 個文字區塊。")

    print("正在初始化 Hugging Face Embedding Model...")
    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    embeddings = HuggingFaceEmbeddings(model_name=model_name)
    print("模型初始化成功。")

    print("正在生成嵌入向量並建立資料庫...")
    db = Chroma.from_documents(
        documents=chunked_documents, 
        embedding=embeddings, 
        persist_directory=DB_PATH
    )
    print(f"向量資料庫已成功建立！儲存路徑: '{DB_PATH}'")


if __name__ == "__main__":
    build_database()