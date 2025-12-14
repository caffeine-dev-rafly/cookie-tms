class ClientRouter:
    """
    A router to control all database operations on models in the
    inspector application.
    """
    route_app_labels = {'inspector'}

    def db_for_read(self, model, **hints):
        """
        Attempts to read inspector models go to client_db.
        """
        if model._meta.app_label in self.route_app_labels:
            return 'client_db'
        return None

    def db_for_write(self, model, **hints):
        """
        Attempts to write inspector models go to client_db.
        """
        if model._meta.app_label in self.route_app_labels:
            return 'client_db'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations if a model in the inspector app is involved.
        """
        if (
            obj1._meta.app_label in self.route_app_labels or
            obj2._meta.app_label in self.route_app_labels
        ):
           return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Make sure the inspector app only appears in the 'client_db'
        database.
        """
        if app_label in self.route_app_labels:
            return db == 'client_db'
        return None

class DatabaseRouter:
    """
    A router to control all database operations on models in the
    inspector application.
    """
    def db_for_read(self, model, **hints):
        # If the app is 'inspector', read from client_db
        if model._meta.app_label == 'inspector':
            return 'client_db'
        return 'default'

    def db_for_write(self, model, **hints):
        # Allow 'inspector' app to WRITE to the client database
        if model._meta.app_label == 'inspector':
            return 'client_db'
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        # Make sure 'inspector' models are NOT created in the default DB
        if app_label == 'inspector':
            return False
        return True