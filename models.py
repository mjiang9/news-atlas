from app import db
from sqlalchemy.dialects.postgresql import JSON


class News(db.Model):
    __tablename__ = 'news'

    id = db.Column(db.Integer, primary_key=True)
    state = db.Column(db.String())
    county = db.Column(db.String())
    result = db.Column(db.JSON())
    keywords = db.Column(db.ARRAY(db.String()))

    def __init__(self, state, result, keywords):
        self.county = county
        self.state = state
        self.result = result
        self.keywords = keywords

    def __repr__(self):
        return '<id {}>'.format(self.id)