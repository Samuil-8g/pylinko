from app import app
from flask import render_template, request, jsonify
from app.plinko_core import drop_ball_and_bet, money_manager

@app.route('/')
def index():
    return render_template('index.html', balance=money_manager.balance)

@app.route('/api/drop_ball', methods=['POST'])
def drop_ball_api():
    bet = request.json.get('bet', 10)
    moves, slot, reward, balance = drop_ball_and_bet(bet)
    if moves is None:
        return jsonify({'error': 'Insufficient balance', 'balance': balance})
    return jsonify({'moves': moves, 'slot': slot, 'reward': reward, 'balance': balance})