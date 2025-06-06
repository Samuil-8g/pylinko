import random

MULTIPLIERS = [
    1000, 130, 26, 9, 4, 2, 0.2, 0.2,
    0.2,  # center
    0.2, 0.2, 2, 4, 9, 26, 130, 1000
]
ROWS = 16
COLS = 17

class MoneyManager:
    def __init__(self, initial_balance=1000):
        self.balance = initial_balance

    def can_bet(self, amount):
        return self.balance >= amount

    def place_bet(self, amount):
        if self.can_bet(amount):
            self.balance -= amount
            return True
        return False

    def add_reward(self, amount):
        self.balance += amount

money_manager = MoneyManager()

def random_path():
    moves = []
    current_col = COLS // 2
    for row in range(1, ROWS):
        if current_col == 0:
            move = 1
        elif current_col == row:
            move = 0
        else:
            move = random.randint(0, 1)
        moves.append(move)
        current_col += 1 if move == 1 else -1
    return moves

def path_to_slot(moves):
    col = COLS // 2
    for row, move in enumerate(moves, 1):
        if col == 0:
            col += 1
        elif col == row:
            col -= 1
        else:
            col += 1 if move == 1 else -1
    return col

def drop_ball_and_bet(bet):
    if not money_manager.can_bet(bet):
        return None, None, None, money_manager.balance
    moves = random_path()
    slot = path_to_slot(moves)
    multiplier = MULTIPLIERS[slot]
    reward = int(bet * multiplier)
    money_manager.place_bet(bet)
    money_manager.add_reward(reward)
    return moves, slot, reward, money_manager.balance