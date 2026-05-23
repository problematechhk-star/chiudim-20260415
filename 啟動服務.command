#!/bin/zsh

# 確保腳本在當前目錄下執行
cd "$(dirname "$0")"

echo "=========================================================="
echo "    觀潮浸信會「潮食工房」會員系統 - 啟動腳本 (macOS)"
echo "=========================================================="
echo ""

# 檢查是否安裝了 Node.js
if ! command -v node &> /dev/null; then
    echo "錯誤: 找不到 Node.js。請先安裝 Node.js (https://nodejs.org/)"
    echo "按 Enter 鍵結束..."
    read
    exit 1
fi

# 如果 node_modules 不存在，則安裝依賴
if [ ! -d "node_modules" ]; then
    echo "正在安裝必要的組件，請稍候 (這可能需要幾分鐘)..."
    npm install
    if [ $? -ne 0 ]; then
        echo "安裝失敗。請檢查網絡連接後再試。"
        echo "按 Enter 鍵結束..."
        read
        exit 1
    fi
fi

# 啟動後端伺服器 (在背景執行)
echo "1. 正在啟動後端伺服器 (Port 3001)..."
node server.cjs &
BACKEND_PID=$!

# 等待一下確保後端啟動
sleep 2

# 啟動前端開發伺服器
echo "2. 正在啟動前端表格..."
echo "啟動後，請在瀏覽器中訪問顯示的 URL (通常是 http://localhost:8080)"
echo "若要結束系統，請在此視窗按下 Ctrl+C 或直接關閉視窗"
echo ""

# 定義清理函數
cleanup() {
    echo ""
    echo "正在停止所有服務，請稍候..."
    # 殺掉後端進程
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    # 停止當前進程組（包括前端）
    kill 0
}

# 捕獲中斷訊號 (Ctrl+C, 關閉視窗, 終止)
trap cleanup INT TERM EXIT HUP

# 啟動前端
npm run dev
