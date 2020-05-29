from app import db
from sqlalchemy.dialects.postgresql import JSON


class News(db.Model):
    __tablename__ = 'news'

    id = db.Column(db.Integer, primary_key=True)
    state = db.Column(db.String())
    source = db.Column(db.String())
    title = db.Column(db.String(), unique=True)
    description = db.Column(db.String())
    date = db.Column(db.String())

    def __init__(self, state, source, title, description, date):
        self.state = state
        self.source = source
        self.title = title
        self.description = description
        self.date = date

    def __repr__(self):
        return '<id {}>'.format(self.id)