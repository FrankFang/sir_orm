import { databaseClient } from './databaseClient';
import { Base } from './base';



class User extends Base {
  // 约定优于配置
}
class Article extends Base {
}
// users id:bigint name:string age:int
async function main() {
  // await User.create({ name: 'frank' })
  // console.log(await User.all)
  const u1 = await User.first()
  if(!u1) return
  await u1.destroy()
  console.log('已删除')
  console.log(await User.all)
  // process.exit()
}
main().finally(()=>{
  databaseClient.destroy()
})

process.on('exit', function () {
  console.log('Goodbye!');
});
