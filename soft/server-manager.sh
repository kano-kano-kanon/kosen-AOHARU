#!/bin/bash

# Kosen AOHARU サーバー管理スクリプト

set -e

PROJECT_DIR="/workspaces/kosen-AOHARU/soft"
LOG_DIR="$PROJECT_DIR/logs"

# ログディレクトリを作成
mkdir -p "$LOG_DIR"

# 関数定義
print_status() {
    echo "================================"
    echo " Kosen AOHARU Server Manager"
    echo "================================"
}

start_services() {
    echo "🚀 サービスを開始しています..."
    
    cd "$PROJECT_DIR"
    
    # Next.jsをビルド
    echo "📦 Next.jsアプリをビルド中..."
    npm run build
    
    # PM2でサービスを開始
    echo "🔧 PM2でサービスを開始中..."
    npm run pm2-start
    
    echo "✅ 全てのサービスが開始されました!"
    echo "📡 Web: http://localhost:3000"
    echo "💬 Chat: ws://localhost:3005"
}

stop_services() {
    echo "🛑 サービスを停止しています..."
    cd "$PROJECT_DIR"
    npm run pm2-stop
    echo "✅ 全てのサービスが停止されました"
}

restart_services() {
    echo "🔄 サービスを再起動しています..."
    cd "$PROJECT_DIR"
    npm run pm2-restart
    echo "✅ 全てのサービスが再起動されました"
}

check_status() {
    echo "📊 サービス状況:"
    pm2 status
}

show_logs() {
    echo "📜 ログ表示:"
    npm run pm2-logs
}

install_pm2() {
    echo "📦 PM2をインストールしています..."
    npm install -g pm2
    echo "✅ PM2のインストールが完了しました"
}

setup_systemd() {
    echo "🔧 systemdサービスを設定しています..."
    sudo cp kosen-aoharu.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable kosen-aoharu
    echo "✅ systemdサービスの設定が完了しました"
    echo "   sudo systemctl start kosen-aoharu で開始できます"
}

# メイン処理
case "$1" in
    start)
        print_status
        start_services
        ;;
    stop)
        print_status
        stop_services
        ;;
    restart)
        print_status
        restart_services
        ;;
    status)
        print_status
        check_status
        ;;
    logs)
        show_logs
        ;;
    install-pm2)
        install_pm2
        ;;
    setup-systemd)
        setup_systemd
        ;;
    *)
        print_status
        echo "使用方法: $0 {start|stop|restart|status|logs|install-pm2|setup-systemd}"
        echo ""
        echo "コマンド:"
        echo "  start        - サービスを開始"
        echo "  stop         - サービスを停止"
        echo "  restart      - サービスを再起動"
        echo "  status       - サービス状況を表示"
        echo "  logs         - ログを表示"
        echo "  install-pm2  - PM2をインストール"
        echo "  setup-systemd - systemdサービスを設定"
        exit 1
        ;;
esac
