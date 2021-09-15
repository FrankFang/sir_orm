import { Base } from './base'

class User extends Base{
  static hasMany = ['articles', 'comments']

}
class Article extends Base{
  static belongsTo = 'user'
}
class Comments extends Base{
  static belongsTo = 'user'
}

export { Base } 