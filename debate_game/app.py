from flask import Flask, render_template, jsonify, request
import random, json

app = Flask(__name__)

game_data = {
    'students': {},
    'current_round': None,
    'class_strength': None
}

def load_topics():
    try:
        with open('topics.json', 'r') as f:
            data = json.load(f)
            return data['topics']
    except Exception:
        return [
            "AI Ethics in Modern Society",
            "Universal Basic Income",
            "Climate Change Solutions",
            "Social Media Regulation",
            "Space Exploration Funding"
        ]

def split_teams(strength):
    half = strength // 2
    team_a = list(range(1, half+1))
    team_b = list(range(half+1, strength+1))
    return team_a, team_b

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/scoreboard')
def scoreboard():
    return render_template('scoreboard.html')

@app.route('/api/get_strength')
def get_strength():
    return jsonify({"strength": game_data['class_strength'] if game_data['class_strength'] else None})

@app.route('/api/set_strength', methods=['POST'])
def set_strength():
    try:
        n = int(request.json.get('strength'))
        if n < 2: raise ValueError
        game_data['class_strength'] = n
        game_data['students'] = {}
        game_data['current_round'] = None
        return jsonify({'success': True})
    except Exception:
        return jsonify({'success': False}), 400

@app.route('/api/start_round', methods=['POST'])
def start_round():
    n = game_data['class_strength']
    if not n:
        return jsonify({'error': "Class strength not set"}), 400
    team_a, team_b = split_teams(n)
    roll_a = random.choice(team_a)
    roll_b = random.choice(team_b)
    topic = random.choice(load_topics())
    game_data['current_round'] = {'roll_a': roll_a, 'roll_b': roll_b, 'topic': topic}
    return jsonify({'roll_a': roll_a, 'roll_b': roll_b, 'topic': topic})

@app.route('/api/declare_winner', methods=['POST'])
def declare_winner():
    data = request.json
    winner_roll = int(data.get('winner_roll'))
    timer_value = data.get('timer_value')
    if not game_data['current_round']:
        return jsonify({'error': 'No active round'}), 400
    rolls = [game_data['current_round']['roll_a'], game_data['current_round']['roll_b']]
    loser_roll = rolls[1] if winner_roll == rolls[0] else rolls[0]
    for r in rolls:
        if r not in game_data['students']:
            game_data['students'][r] = {'score': 0, 'times': []}
    game_data['students'][winner_roll]['score'] += 1
    game_data['students'][winner_roll]['times'].append(timer_value)
    game_data['students'][loser_roll]['times'].append(None)
    # Next round
    n = game_data['class_strength']
    team_a, team_b = split_teams(n)
    roll_a = random.choice(team_a)
    roll_b = random.choice(team_b)
    topic = random.choice(load_topics())
    game_data['current_round'] = {'roll_a': roll_a, 'roll_b': roll_b, 'topic': topic}
    return jsonify({'success': True, 'next_round': {'roll_a': roll_a, 'roll_b': roll_b, 'topic': topic}})

@app.route('/api/get_scoreboard', methods=['GET'])
def get_scoreboard():
    scoreboard = []
    for roll_number, data in game_data['students'].items():
        last_time = next((t for t in reversed(data['times']) if t), '--')
        scoreboard.append({'roll_number': roll_number, 'score': data['score'], 'last_time': last_time})
    scoreboard.sort(key=lambda x: (-x['score'], x['roll_number']))
    return jsonify({'scoreboard': scoreboard})

@app.route('/api/reset_game', methods=['POST'])
def reset_game():
    game_data['students'] = {}
    game_data['current_round'] = None
    game_data['class_strength'] = None
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)
